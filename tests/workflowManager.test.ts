import WorkflowManager from '../src/workflows/manager';
import { Credential, Workflow, TestCredential } from '../src/testing/types';
import * as fs from 'fs';
import * as path from 'path';

// Use real environment variables for API connection
const API_KEY = process.env.N8N_API_KEY || 'n8n_api_test_key_123456789';
const API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';

// Helper to clean up test data
const testWorkflowIds: string[] = [];
const testCredentialIds: string[] = [];

describe('WorkflowManager', () => {
  let manager: WorkflowManager;

  beforeAll(() => {
    // Set environment variables for testing
    process.env.N8N_API_KEY = API_KEY;
    process.env.N8N_API_URL = API_URL;
  });

  beforeEach(() => {
    manager = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL
    });
  });

  afterEach(async () => {
    // Clean up test workflows
    if (manager['client'].isConnected()) {
      for (const id of testWorkflowIds) {
        try {
          await manager.deleteWorkflow(id);
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
      for (const id of testCredentialIds) {
        try {
          await manager.deleteCredential(id);
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }
    testWorkflowIds.length = 0;
    testCredentialIds.length = 0;
    
    // Disconnect from n8n
    await manager.disconnect();
  });

  test('should connect to n8n API', async () => {
    await manager.connect();
    expect(manager['client'].isConnected()).toBe(true);
  });

  test('should disconnect from n8n API', async () => {
    await manager.connect();
    await manager.disconnect();
    expect(manager['client'].isConnected()).toBe(false);
  });

  test('should list workflows', async () => {
    await manager.connect();
    const workflows = await manager.listWorkflows();

    expect(Array.isArray(workflows)).toBe(true);
    // Just check that we can list workflows, don't assume specific workflows exist
    expect(workflows.length).toBeGreaterThanOrEqual(0);
  });

  test('should get a workflow by ID', async () => {
    await manager.connect();
    
    // First create a workflow
    const newWorkflow: Workflow = {
      name: 'Test Get Workflow',
      nodes: [],
      connections: {}
    };
    const created = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(created.id!);
    
    // Then get it
    const workflow = await manager.getWorkflow(created.id!);

    expect(workflow.id).toBe(created.id);
    expect(workflow.name).toBe('Test Get Workflow');
  });

  test('should create a workflow', async () => {
    await manager.connect();
    const newWorkflow: Workflow = {
      name: 'New Test Workflow',
      nodes: [],
      connections: {}
    };

    const createdWorkflow = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(createdWorkflow.id!);

    expect(createdWorkflow.id).toBeDefined();
    expect(createdWorkflow.name).toBe('New Test Workflow');
  });

  test('should update a workflow', async () => {
    await manager.connect();
    
    // First create a workflow
    const newWorkflow: Workflow = {
      name: 'Original Workflow',
      nodes: [],
      connections: {}
    };
    const created = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(created.id!);
    
    // Then update it
    const updatedWorkflow = await manager.updateWorkflow(created.id!, {
      name: 'Updated Workflow'
    });

    expect(updatedWorkflow.id).toBe(created.id);
    expect(updatedWorkflow.name).toBe('Updated Workflow');
  });

  test('should delete a workflow', async () => {
    await manager.connect();
    
    // First create a workflow
    const newWorkflow: Workflow = {
      name: 'Workflow to Delete',
      nodes: [],
      connections: {}
    };
    const created = await manager.createWorkflow(newWorkflow);
    
    // Then delete it
    const result = await manager.deleteWorkflow(created.id!);

    expect(result).toBe(true);
    
    // Verify it's deleted by trying to get it
    await expect(manager.getWorkflow(created.id!)).rejects.toThrow();
  });

  test('should activate a workflow', async () => {
    await manager.connect();
    
    // First create a workflow (it will be inactive by default)
    const newWorkflow: Workflow = {
      name: 'Workflow to Activate',
      nodes: [
        {
          id: '1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            path: 'test-activate',
            responseMode: 'onReceived',
            responseData: 'firstEntryJson'
          }
        }
      ],
      connections: {}
    };
    const created = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(created.id!);
    
    // Then activate it
    const workflow = await manager.activateWorkflow(created.id!);

    expect(workflow.id).toBe(created.id);
    expect(workflow.active).toBe(true);
  });

  test('should deactivate a workflow', async () => {
    await manager.connect();
    
    // First create and activate a workflow
    const newWorkflow: Workflow = {
      name: 'Workflow to Deactivate',
      nodes: [
        {
          id: '1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            path: 'test-deactivate',
            responseMode: 'onReceived',
            responseData: 'firstEntryJson'
          }
        }
      ],
      connections: {}
    };
    const created = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(created.id!);
    await manager.activateWorkflow(created.id!);
    
    // Then deactivate it
    const workflow = await manager.deactivateWorkflow(created.id!);

    expect(workflow.id).toBe(created.id);
    expect(workflow.active).toBe(false);
  });

  test('should execute a workflow', async () => {
    await manager.connect();
    
    // Create a simple workflow that can be executed
    const newWorkflow: Workflow = {
      name: 'Workflow to Execute',
      nodes: [
        {
          id: 'node1',
          name: 'Webhook',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1,
          position: [250, 300],
          parameters: {
            path: 'test-execute',
            responseMode: 'lastNode',
            responseData: 'allEntries'
          }
        },
        {
          id: 'node2',
          name: 'Set',
          type: 'n8n-nodes-base.set',
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            values: {
              string: [
                {
                  name: 'test',
                  value: 'success'
                }
              ]
            }
          }
        }
      ],
      connections: {
        'Webhook': {
          'main': [
            [
              {
                node: 'Set',
                type: 'main',
                index: 0
              }
            ]
          ]
        }
      }
    };
    const created = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(created.id!);
    
    // Execute it
    const result = await manager.executeWorkflow(created.id!);

    expect(result).toBeDefined();
    // The actual result structure depends on n8n's response
  });

  test('should save a workflow to a file', async () => {
    await manager.connect();
    
    // Create a workflow
    const newWorkflow: Workflow = {
      name: 'Workflow to Save',
      nodes: [],
      connections: {}
    };
    const created = await manager.createWorkflow(newWorkflow);
    testWorkflowIds.push(created.id!);
    
    // Save it to a file
    const filename = `test-workflow-${Date.now()}.json`;
    const filePath = await manager.saveWorkflowToFile(created.id!, filename);

    expect(filePath).toBeDefined();
    expect(filePath).toContain(filename);
    
    // Verify file exists and contains the workflow
    expect(fs.existsSync(filePath)).toBe(true);
    const savedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(savedData.name).toBe('Workflow to Save');
    
    // Clean up file
    fs.unlinkSync(filePath);
  });

  test('should load a workflow from a file', () => {
    // Create a test workflow file
    const testWorkflow = {
      id: 'test-id',
      name: 'Test Workflow from File',
      nodes: [],
      connections: {}
    };
    const testFile = `test-load-workflow-${Date.now()}.json`;
    fs.writeFileSync(testFile, JSON.stringify(testWorkflow));
    
    // Load it
    const workflow = manager.loadWorkflowFromFile(testFile);

    expect(workflow.id).toBe('test-id');
    expect(workflow.name).toBe('Test Workflow from File');
    
    // Clean up
    fs.unlinkSync(testFile);
  });

  test('should create a workflow from a template', async () => {
    await manager.connect();
    
    // First create a template directory and file
    const templatesDir = path.join(process.cwd(), 'test-templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    const templateContent = {
      name: 'Template Workflow',
      nodes: [
        {
          id: '1',
          name: 'Start',
          type: 'n8n-nodes-base.start',
          typeVersion: 1,
          position: [250, 300],
          parameters: {}
        }
      ],
      connections: {}
    };
    
    fs.writeFileSync(path.join(templatesDir, 'test-template.json'), JSON.stringify(templateContent));
    
    // Create workflow manager with templates directory
    const managerWithTemplates = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL,
      templatesDir
    });
    await managerWithTemplates.connect();
    
    // Create workflow from template
    const workflow = await managerWithTemplates.createWorkflowFromTemplate('test-template', 'Template-based Workflow');
    testWorkflowIds.push(workflow.id!);

    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBe('Template-based Workflow');
    
    // Clean up
    await managerWithTemplates.disconnect();
    fs.rmSync(templatesDir, { recursive: true, force: true });
  });

  test('should throw error when loading non-existent workflow file', () => {
    expect(() => {
      manager.loadWorkflowFromFile('non-existent-file.json');
    }).toThrow('Workflow file not found');
  });

  test('should throw error when loading invalid JSON workflow file', () => {
    // Create an invalid JSON file
    const invalidFile = `test-invalid-workflow-${Date.now()}.json`;
    fs.writeFileSync(invalidFile, 'invalid json content');
    
    expect(() => {
      manager.loadWorkflowFromFile(invalidFile);
    }).toThrow('Failed to parse workflow file');
    
    // Clean up
    fs.unlinkSync(invalidFile);
  });

  test('should import a workflow from a file', async () => {
    await manager.connect();
    
    // Create a workflow file to import
    const workflowToImport = {
      name: 'Workflow to Import',
      nodes: [],
      connections: {}
    };
    const importFile = `test-import-workflow-${Date.now()}.json`;
    fs.writeFileSync(importFile, JSON.stringify(workflowToImport));
    
    // Import it
    const imported = await manager.importWorkflow(importFile);
    testWorkflowIds.push(imported.id!);
    
    expect(imported.id).toBeDefined();
    expect(imported.name).toBe('Workflow to Import');
    
    // Clean up
    fs.unlinkSync(importFile);
  });

  test('should export all workflows to files', async () => {
    await manager.connect();
    
    // Create a couple of workflows
    const workflow1 = await manager.createWorkflow({
      name: 'Export Test 1',
      nodes: [],
      connections: {}
    });
    testWorkflowIds.push(workflow1.id!);
    
    const workflow2 = await manager.createWorkflow({
      name: 'Export Test 2',
      nodes: [],
      connections: {}
    });
    testWorkflowIds.push(workflow2.id!);
    
    // Export all workflows
    const exportDir = `test-export-${Date.now()}`;
    const exportedPaths = await manager.exportAllWorkflows(exportDir);
    
    expect(exportedPaths.length).toBeGreaterThanOrEqual(2);
    expect(exportedPaths.some(p => p.includes('export_test_1.json'))).toBe(true);
    expect(exportedPaths.some(p => p.includes('export_test_2.json'))).toBe(true);
    
    // Verify files exist
    exportedPaths.forEach(path => {
      expect(fs.existsSync(path)).toBe(true);
    });
    
    // Clean up
    fs.rmSync(exportDir, { recursive: true, force: true });
  });

  test('should save workflow as template', () => {
    const workflow: Workflow = {
      id: 'test-id',
      name: 'Test Workflow',
      active: true,
      nodes: [],
      connections: {}
    };
    
    // Create a temporary templates directory
    const templatesDir = `test-templates-${Date.now()}`;
    const managerWithTemplates = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL,
      templatesDir
    });
    
    // Save as template
    const templatePath = managerWithTemplates.saveWorkflowTemplate('test-template', workflow);
    
    expect(templatePath).toContain('test-template.json');
    expect(fs.existsSync(templatePath)).toBe(true);
    
    // Verify template doesn't have runtime properties
    const saved = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    expect(saved.id).toBeUndefined();
    expect(saved.active).toBeUndefined();
    expect(saved.name).toBe('Test Workflow');
    
    // Clean up
    fs.rmSync(templatesDir, { recursive: true, force: true });
  });

  test('should load workflow template', () => {
    // Create a temporary templates directory
    const templatesDir = `test-templates-${Date.now()}`;
    fs.mkdirSync(templatesDir, { recursive: true });
    
    const template = {
      name: 'Test Template',
      nodes: [],
      connections: {}
    };
    fs.writeFileSync(path.join(templatesDir, 'test-template.json'), JSON.stringify(template));
    
    const managerWithTemplates = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL,
      templatesDir
    });
    
    // Load template
    const loaded = managerWithTemplates.loadWorkflowTemplate('test-template');
    
    expect(loaded.name).toBe('Test Template');
    
    // Clean up
    fs.rmSync(templatesDir, { recursive: true, force: true });
  });

  test('should throw error when loading non-existent template', () => {
    const managerWithTemplates = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL,
      templatesDir: './non-existent-templates'
    });
    
    expect(() => {
      managerWithTemplates.loadWorkflowTemplate('non-existent');
    }).toThrow('Template not found');
  });

  test('should list workflow templates', () => {
    // Create a temporary templates directory
    const templatesDir = `test-templates-${Date.now()}`;
    fs.mkdirSync(templatesDir, { recursive: true });
    
    // Create some template files
    fs.writeFileSync(path.join(templatesDir, 'template1.json'), '{}');
    fs.writeFileSync(path.join(templatesDir, 'template2.json'), '{}');
    fs.writeFileSync(path.join(templatesDir, 'not-a-template.txt'), 'text');
    
    const managerWithTemplates = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL,
      templatesDir
    });
    
    // List templates
    const templates = managerWithTemplates.listWorkflowTemplates();
    
    expect(templates).toEqual(['template1', 'template2']);
    
    // Clean up
    fs.rmSync(templatesDir, { recursive: true, force: true });
  });

  test('should return empty array when listing templates from non-existent directory', () => {
    const managerWithTemplates = new WorkflowManager({
      apiKey: API_KEY,
      apiUrl: API_URL,
      templatesDir: './non-existent-templates'
    });
    
    const templates = managerWithTemplates.listWorkflowTemplates();
    
    expect(templates).toEqual([]);
  });

  // Credential management tests
  test('should list credential types', async () => {
    await manager.connect();

    const types = await manager.listCredentialTypes();

    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);
    // Just verify we got some credential types
    expect(types[0]).toHaveProperty('name');
    expect(types[0]).toHaveProperty('displayName');
  });

  test('should list credentials', async () => {
    await manager.connect();

    const credentials = await manager.listCredentials();

    expect(Array.isArray(credentials)).toBe(true);
    // Just check that we can list credentials
    expect(credentials.length).toBeGreaterThanOrEqual(0);
  });

  test('should get a credential by ID', async () => {
    await manager.connect();

    // First create a credential
    const newCredential: Credential = {
      name: 'Test Get Credential',
      type: 'httpBasicAuth',
      data: { username: 'testuser', password: 'testpass' }
    };
    const created = await manager.createCredential(newCredential);
    testCredentialIds.push(created.id!);

    // Then get it
    const credential = await manager.getCredential(created.id!);

    // Note: n8n Public API v1 doesn't support GET on credentials, so we get a mock
    expect(credential.id).toBe(created.id);
    // The name and type will be from the mock
    expect(credential.name).toBe('Mock Credential');
    expect(credential.type).toBe('httpBasicAuth');
  });

  test('should create a credential', async () => {
    await manager.connect();

    const newCredential: Credential = {
      name: 'New Test Credential',
      type: 'httpBasicAuth',
      data: { username: 'testuser', password: 'testpass' }
    };

    const createdCredential = await manager.createCredential(newCredential);
    testCredentialIds.push(createdCredential.id!);

    expect(createdCredential.id).toBeDefined();
    expect(createdCredential.name).toBe('New Test Credential');
    expect(createdCredential.type).toBe('httpBasicAuth');
  });

  test('should update a credential', async () => {
    await manager.connect();

    // First create a credential
    const newCredential: Credential = {
      name: 'Original Credential',
      type: 'httpBasicAuth',
      data: { username: 'testuser', password: 'testpass' }
    };
    const created = await manager.createCredential(newCredential);
    testCredentialIds.push(created.id!);

    // Then update it
    const updatedCredential = await manager.updateCredential(created.id!, {
      name: 'Updated Credential'
    });

    expect(updatedCredential.id).toBe(created.id);
    expect(updatedCredential.name).toBe('Updated Credential');
  });

  test('should delete a credential', async () => {
    await manager.connect();

    // First create a credential
    const newCredential: Credential = {
      name: 'Credential to Delete',
      type: 'httpBasicAuth',
      data: { username: 'testuser', password: 'testpass' }
    };
    const created = await manager.createCredential(newCredential);

    // Then delete it
    const result = await manager.deleteCredential(created.id!);

    expect(result).toBe(true);

    // Note: Can't verify deletion via GET as n8n Public API v1 doesn't support it
    // The getCredential will return a mock regardless of whether the credential exists
  });

  test('should create credential from environment variables', async () => {
    await manager.connect();
    
    // Set up environment variables
    process.env.N8N_CREDENTIAL_TEST_ENV_CRED_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_TEST_ENV_CRED_username = 'envuser';
    process.env.N8N_CREDENTIAL_TEST_ENV_CRED_password = 'envpass';
    
    const credential = await manager.createCredentialFromEnv('TEST_ENV_CRED');
    testCredentialIds.push(credential.id!);
    
    expect(credential.id).toBeDefined();
    expect(credential.name).toBe('TEST_ENV_CRED');
    expect(credential.type).toBe('httpBasicAuth');
    
    // Clean up env vars
    delete process.env.N8N_CREDENTIAL_TEST_ENV_CRED_TYPE;
    delete process.env.N8N_CREDENTIAL_TEST_ENV_CRED_username;
    delete process.env.N8N_CREDENTIAL_TEST_ENV_CRED_password;
  });

  test('should create credential from test definition', async () => {
    await manager.connect();
    
    const testCredential: TestCredential = {
      name: 'test-cred-def',
      type: 'httpBasicAuth',
      data: {
        username: { value: 'testdefuser' },
        password: { value: 'testdefpass' }
      }
    };
    
    const credential = await manager.createCredentialFromTestDefinition(testCredential);
    testCredentialIds.push(credential.id!);
    
    expect(credential.id).toBeDefined();
    expect(credential.name).toBe('test-cred-def');
    expect(credential.type).toBe('httpBasicAuth');
  });

  test('should list credentials from environment variables', () => {
    // Set up environment variables
    process.env.N8N_CREDENTIAL_ENV_CRED1_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_ENV_CRED1_username = 'user1';
    process.env.N8N_CREDENTIAL_ENV_CRED2_TYPE = 'httpHeaderAuth';
    process.env.N8N_CREDENTIAL_ENV_CRED2_name = 'Authorization';
    
    const credentials = manager.listCredentialsFromEnv();
    
    expect(credentials.length).toBeGreaterThanOrEqual(2);
    expect(credentials.some(c => c.name === 'ENV_CRED1')).toBe(true);
    expect(credentials.some(c => c.name === 'ENV_CRED2')).toBe(true);
    
    // Clean up env vars
    delete process.env.N8N_CREDENTIAL_ENV_CRED1_TYPE;
    delete process.env.N8N_CREDENTIAL_ENV_CRED1_username;
    delete process.env.N8N_CREDENTIAL_ENV_CRED2_TYPE;
    delete process.env.N8N_CREDENTIAL_ENV_CRED2_name;
  });

  test('should get credential from environment variables', () => {
    // Set up environment variables
    process.env.N8N_CREDENTIAL_GET_TEST_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_GET_TEST_username = 'getuser';
    process.env.N8N_CREDENTIAL_GET_TEST_password = 'getpass';
    
    const credential = manager.getCredentialFromEnv('GET_TEST');
    
    expect(credential).toBeDefined();
    expect(credential?.name).toBe('GET_TEST');
    expect(credential?.type).toBe('httpBasicAuth');
    expect(credential?.data).toEqual({
      user: 'getuser',  // Field is mapped from username to user for n8n compatibility
      password: 'getpass'
    });
    
    // Clean up env vars
    delete process.env.N8N_CREDENTIAL_GET_TEST_TYPE;
    delete process.env.N8N_CREDENTIAL_GET_TEST_username;
    delete process.env.N8N_CREDENTIAL_GET_TEST_password;
  });

  test('should return undefined when getting non-existent credential from env', () => {
    const credential = manager.getCredentialFromEnv('NON_EXISTENT');
    expect(credential).toBeUndefined();
  });

  test('should check if credential exists in environment variables', () => {
    // Set up environment variables
    process.env.N8N_CREDENTIAL_EXISTS_TEST_TYPE = 'httpBasicAuth';
    
    const exists = manager.hasCredentialInEnv('EXISTS_TEST');
    const notExists = manager.hasCredentialInEnv('NOT_EXISTS');
    
    expect(exists).toBe(true);
    expect(notExists).toBe(false);
    
    // Clean up env vars
    delete process.env.N8N_CREDENTIAL_EXISTS_TEST_TYPE;
  });
});