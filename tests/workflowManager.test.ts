import WorkflowManager from '../src/workflows/manager';
import { Credential, Workflow } from '../src/testing/types';

// Mock the n8n client
jest.mock('../src/clients/realN8nClient', () => {
  return jest.fn().mockImplementation(() => {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockImplementation((endpoint) => {
        if (endpoint === '/workflows') {
          return Promise.resolve({
            data: [
              { id: '1', name: 'Workflow 1', active: true },
              { id: '2', name: 'Workflow 2', active: false }
            ]
          });
        } else if (endpoint.startsWith('/workflows/')) {
          const id = endpoint.split('/')[2];
          return Promise.resolve({
            data: {
              id,
              name: `Workflow ${id}`,
              active: id === '1',
              nodes: [],
              connections: {}
            }
          });
        } else if (endpoint === '/credentials') {
          return Promise.resolve({
            data: [
              { id: '1', name: 'Credential 1', type: 'httpBasicAuth' },
              { id: '2', name: 'Credential 2', type: 'oAuth2Api' }
            ]
          });
        } else if (endpoint.startsWith('/credentials/')) {
          const id = endpoint.split('/')[2];
          return Promise.resolve({
            data: {
              id,
              name: `Credential ${id}`,
              type: 'httpBasicAuth',
              data: { username: 'test', password: 'test' }
            }
          });
        } else if (endpoint === '/credentials/types') {
          return Promise.resolve({
            data: [
              { name: 'httpBasicAuth', displayName: 'HTTP Basic Auth' },
              { name: 'oAuth2Api', displayName: 'OAuth2 API' }
            ]
          });
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
      }),
      post: jest.fn().mockImplementation((endpoint, data) => {
        if (endpoint === '/workflows') {
          return Promise.resolve({
            data: {
              id: '3',
              ...data,
              active: false
            }
          });
        } else if (endpoint.includes('/activate')) {
          const id = endpoint.split('/')[2];
          return Promise.resolve({
            data: {
              id,
              name: `Workflow ${id}`,
              active: true,
              nodes: [],
              connections: {}
            }
          });
        } else if (endpoint.includes('/deactivate')) {
          const id = endpoint.split('/')[2];
          return Promise.resolve({
            data: {
              id,
              name: `Workflow ${id}`,
              active: false,
              nodes: [],
              connections: {}
            }
          });
        } else if (endpoint.includes('/execute')) {
          return Promise.resolve({
            data: {
              success: true,
              data: { result: 'Execution successful' }
            }
          });
        } else if (endpoint === '/credentials') {
          return Promise.resolve({
            data: {
              id: '3',
              ...data
            }
          });
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
      }),
      put: jest.fn().mockImplementation((endpoint, data) => {
        if (endpoint.startsWith('/workflows/')) {
          const id = endpoint.split('/')[2];
          return Promise.resolve({
            data: {
              id,
              ...data,
              active: false
            }
          });
        } else if (endpoint.startsWith('/credentials/')) {
          const id = endpoint.split('/')[2];
          return Promise.resolve({
            data: {
              id,
              ...data
            }
          });
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
      }),
      delete: jest.fn().mockImplementation((endpoint) => {
        if (endpoint.startsWith('/workflows/')) {
          return Promise.resolve({ data: { success: true } });
        } else if (endpoint.startsWith('/credentials/')) {
          return Promise.resolve({ data: { success: true } });
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
      }),
      isConnected: jest.fn().mockReturnValue(true)
    };
  });
});

// Mock the file system
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    writeFileSync: jest.fn(),
    readFileSync: jest.fn().mockImplementation((path) => {
      if (path.includes('template')) {
        return JSON.stringify({
          name: 'Template Workflow',
          nodes: [],
          connections: {}
        });
      }
      return JSON.stringify({
        id: '1',
        name: 'Workflow 1',
        nodes: [],
        connections: {}
      });
    }),
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn()
  };
});

describe('WorkflowManager', () => {
  let manager: WorkflowManager;

  beforeEach(() => {
    manager = new WorkflowManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should connect to n8n API', async () => {
    await manager.connect();
    expect(manager['client'].connect).toHaveBeenCalled();
  });

  test('should disconnect from n8n API', async () => {
    await manager.disconnect();
    expect(manager['client'].disconnect).toHaveBeenCalled();
  });

  test('should list workflows', async () => {
    await manager.connect();
    const workflows = await manager.listWorkflows();

    expect(workflows).toHaveLength(2);
    expect(workflows[0].name).toBe('Workflow 1');
    expect(workflows[1].name).toBe('Workflow 2');
  });

  test('should get a workflow by ID', async () => {
    await manager.connect();
    const workflow = await manager.getWorkflow('1');

    expect(workflow.id).toBe('1');
    expect(workflow.name).toBe('Workflow 1');
  });

  test('should create a workflow', async () => {
    await manager.connect();
    const newWorkflow: Workflow = {
      name: 'New Workflow',
      nodes: [],
      connections: {}
    };

    const createdWorkflow = await manager.createWorkflow(newWorkflow);

    expect(createdWorkflow.id).toBe('3');
    expect(createdWorkflow.name).toBe('New Workflow');
  });

  test('should update a workflow', async () => {
    await manager.connect();
    const updatedWorkflow = await manager.updateWorkflow('1', {
      name: 'Updated Workflow'
    });

    expect(updatedWorkflow.id).toBe('1');
    expect(updatedWorkflow.name).toBe('Updated Workflow');
  });

  test('should delete a workflow', async () => {
    await manager.connect();
    const result = await manager.deleteWorkflow('1');

    expect(result).toBe(true);
  });

  test('should activate a workflow', async () => {
    await manager.connect();
    const workflow = await manager.activateWorkflow('2');

    expect(workflow.id).toBe('2');
    expect(workflow.active).toBe(true);
  });

  test('should deactivate a workflow', async () => {
    await manager.connect();
    const workflow = await manager.deactivateWorkflow('1');

    expect(workflow.id).toBe('1');
    expect(workflow.active).toBe(false);
  });

  test('should execute a workflow', async () => {
    await manager.connect();
    const result = await manager.executeWorkflow('1');

    expect(result.success).toBe(true);
    expect(result.data.result).toBe('Execution successful');
  });

  test('should save a workflow to a file', async () => {
    await manager.connect();
    const filePath = await manager.saveWorkflowToFile('1');

    expect(filePath).toBeDefined();
    expect(require('fs').writeFileSync).toHaveBeenCalled();
  });

  test('should load a workflow from a file', () => {
    const workflow = manager.loadWorkflowFromFile('workflow.json');

    expect(workflow.id).toBe('1');
    expect(workflow.name).toBe('Workflow 1');
  });

  test('should create a workflow from a template', async () => {
    await manager.connect();
    const workflow = await manager.createWorkflowFromTemplate('test-template', 'Template-based Workflow');

    expect(workflow.id).toBe('3');
    expect(workflow.name).toBe('Template-based Workflow');
  });

  // Credential management tests
  test('should list credential types', async () => {
    await manager.connect();

    // Mock the n8nClientUtils.listCredentialTypes function
    const n8nClientUtils = require('../src/utils/n8nClient');
    const originalListCredentialTypes = n8nClientUtils.listCredentialTypes;

    n8nClientUtils.listCredentialTypes = jest.fn().mockResolvedValue([
      { name: 'httpBasicAuth', displayName: 'HTTP Basic Auth' },
      { name: 'oAuth2Api', displayName: 'OAuth2 API' }
    ]);

    const types = await manager.listCredentialTypes();

    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBe(2);
    expect(types[0].name).toBe('httpBasicAuth');
    expect(types[1].name).toBe('oAuth2Api');

    // Restore the original function
    n8nClientUtils.listCredentialTypes = originalListCredentialTypes;
  });

  test('should list credentials', async () => {
    await manager.connect();

    // Mock the n8nClientUtils.listCredentials function
    const n8nClientUtils = require('../src/utils/n8nClient');
    const originalListCredentials = n8nClientUtils.listCredentials;

    n8nClientUtils.listCredentials = jest.fn().mockResolvedValue([
      { id: '1', name: 'Credential 1', type: 'httpBasicAuth' },
      { id: '2', name: 'Credential 2', type: 'oAuth2Api' }
    ]);

    const credentials = await manager.listCredentials();

    expect(credentials).toHaveLength(2);
    expect(credentials[0].name).toBe('Credential 1');
    expect(credentials[1].name).toBe('Credential 2');

    // Restore the original function
    n8nClientUtils.listCredentials = originalListCredentials;
  });

  test('should get a credential by ID', async () => {
    await manager.connect();

    // Mock the n8nClientUtils.getCredential function
    const n8nClientUtils = require('../src/utils/n8nClient');
    const originalGetCredential = n8nClientUtils.getCredential;

    n8nClientUtils.getCredential = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Credential 1',
      type: 'httpBasicAuth',
      data: { username: 'test', password: 'test' }
    });

    const credential = await manager.getCredential('1');

    expect(credential.id).toBe('1');
    expect(credential.name).toBe('Credential 1');
    expect(credential.type).toBe('httpBasicAuth');

    // Restore the original function
    n8nClientUtils.getCredential = originalGetCredential;
  });

  test('should create a credential', async () => {
    await manager.connect();

    // Mock the n8nClientUtils.createCredential function
    const n8nClientUtils = require('../src/utils/n8nClient');
    const originalCreateCredential = n8nClientUtils.createCredential;

    n8nClientUtils.createCredential = jest.fn().mockImplementation((client, credential) => {
      return Promise.resolve({
        id: '3',
        ...credential
      });
    });

    const newCredential: Credential = {
      name: 'New Credential',
      type: 'httpBasicAuth',
      data: { username: 'test', password: 'test' }
    };

    const createdCredential = await manager.createCredential(newCredential);

    expect(createdCredential.id).toBe('3');
    expect(createdCredential.name).toBe('New Credential');
    expect(createdCredential.type).toBe('httpBasicAuth');

    // Restore the original function
    n8nClientUtils.createCredential = originalCreateCredential;
  });

  test('should update a credential', async () => {
    await manager.connect();

    // Mock the n8nClientUtils.updateCredential function
    const n8nClientUtils = require('../src/utils/n8nClient');
    const originalUpdateCredential = n8nClientUtils.updateCredential;

    n8nClientUtils.updateCredential = jest.fn().mockImplementation((client, id, credential) => {
      return Promise.resolve({
        id,
        ...credential
      });
    });

    const updatedCredential = await manager.updateCredential('1', {
      name: 'Updated Credential'
    });

    expect(updatedCredential.id).toBe('1');
    expect(updatedCredential.name).toBe('Updated Credential');

    // Restore the original function
    n8nClientUtils.updateCredential = originalUpdateCredential;
  });

  test('should delete a credential', async () => {
    await manager.connect();

    // Mock the n8nClientUtils.deleteCredential function
    const n8nClientUtils = require('../src/utils/n8nClient');
    const originalDeleteCredential = n8nClientUtils.deleteCredential;

    n8nClientUtils.deleteCredential = jest.fn().mockResolvedValue(true);

    const result = await manager.deleteCredential('1');

    expect(result).toBe(true);

    // Restore the original function
    n8nClientUtils.deleteCredential = originalDeleteCredential;
  });
});