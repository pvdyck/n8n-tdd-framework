import WorkflowManager from '../src/workflows/manager';
import { Workflow } from '../src/testing/types';

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
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
      }),
      delete: jest.fn().mockImplementation((endpoint) => {
        if (endpoint.startsWith('/workflows/')) {
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
});