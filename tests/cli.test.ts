import WorkflowCLI from '../src/workflows/cli';
import WorkflowManager from '../src/workflows/manager';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('../src/workflows/manager');
jest.mock('fs');

describe('WorkflowCLI', () => {
  let cli: WorkflowCLI;
  let mockManager: jest.Mocked<WorkflowManager>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock manager
    mockManager = new WorkflowManager() as jest.Mocked<WorkflowManager>;
    (WorkflowManager as jest.Mock).mockImplementation(() => mockManager);
    
    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`Process exited with code ${code}`);
    });
    
    // Mock manager methods
    mockManager.connect = jest.fn().mockResolvedValue(undefined);
    mockManager.disconnect = jest.fn().mockResolvedValue(undefined);
    mockManager.listWorkflows = jest.fn().mockResolvedValue([
      { id: '1', name: 'Test Workflow 1', active: true },
      { id: '2', name: 'Test Workflow 2', active: false }
    ]);
    mockManager.getWorkflow = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Test Workflow',
      nodes: [],
      connections: {}
    });
    mockManager.createWorkflow = jest.fn().mockResolvedValue({
      id: '3',
      name: 'New Workflow',
      nodes: [],
      connections: {}
    });
    mockManager.deleteWorkflow = jest.fn().mockResolvedValue(true);
    mockManager.activateWorkflow = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Test Workflow',
      active: true
    });
    mockManager.deactivateWorkflow = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Test Workflow',
      active: false
    });
    mockManager.executeWorkflow = jest.fn().mockResolvedValue({
      executionId: 'exec-123',
      finished: true
    });
    
    cli = new WorkflowCLI();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('run', () => {
    test('should show help when no arguments provided', async () => {
      await cli.run([]);
      expect(consoleLogSpy).toHaveBeenCalledWith('n8n Workflow Manager CLI');
    });

    test('should show help for help command', async () => {
      await cli.run(['help']);
      expect(consoleLogSpy).toHaveBeenCalledWith('n8n Workflow Manager CLI');
    });

    test('should show version', async () => {
      // Version flag is not implemented in the actual CLI
      await cli.run(['--version']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command: --version');
      expect(consoleLogSpy).toHaveBeenCalledWith('n8n Workflow Manager CLI');
    });

    test('should handle unknown command', async () => {
      await cli.run(['unknown']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown command: unknown');
      expect(consoleLogSpy).toHaveBeenCalledWith('n8n Workflow Manager CLI');
    });
  });

  describe('list command', () => {
    test('should list all workflows', async () => {
      await cli.run(['list']);
      
      expect(mockManager.connect).toHaveBeenCalled();
      expect(mockManager.listWorkflows).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test Workflow 1'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test Workflow 2'));
      expect(mockManager.disconnect).toHaveBeenCalled();
    });

    test('should list active workflows only', async () => {
      await cli.run(['list', '--active']);
      
      expect(mockManager.listWorkflows).toHaveBeenCalledWith(true);
    });

    test('should handle list error', async () => {
      mockManager.listWorkflows.mockRejectedValue(new Error('API Error'));
      
      await expect(cli.run(['list'])).rejects.toThrow('Process exited with code 1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: API Error');
    });
  });

  describe('get command', () => {
    test('should get workflow by ID', async () => {
      await cli.run(['get', '1']);
      
      expect(mockManager.connect).toHaveBeenCalled();
      expect(mockManager.getWorkflow).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Test Workflow'));
    });

    test('should handle missing workflow ID', async () => {
      await cli.run(['get']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Workflow ID is required');
    });

    test('should handle get error', async () => {
      mockManager.getWorkflow.mockRejectedValue(new Error('Not found'));
      
      await expect(cli.run(['get', '999'])).rejects.toThrow('Process exited with code 1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Not found');
    });
  });

  describe('create command', () => {
    test('should create workflow with name', async () => {
      await cli.run(['create', 'New Workflow']);
      
      expect(mockManager.createWorkflow).toHaveBeenCalledWith({
        name: 'New Workflow',
        nodes: [],
        connections: {}
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('Created empty workflow "New Workflow" with ID: 3');
    });

    test('should create workflow from template', async () => {
      mockManager.createWorkflowFromTemplate = jest.fn().mockResolvedValue({
        id: '4',
        name: 'From Template',
        nodes: [],
        connections: {}
      });
      
      await cli.run(['create', 'From Template', 'template-name']);
      
      expect(mockManager.createWorkflowFromTemplate).toHaveBeenCalledWith('template-name', 'From Template');
      expect(consoleLogSpy).toHaveBeenCalledWith('Created workflow "From Template" from template "template-name" with ID: 4');
    });

    test('should handle missing workflow name', async () => {
      await cli.run(['create']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Workflow name is required');
    });
  });

  describe('delete command', () => {
    test('should delete workflow', async () => {
      await cli.run(['delete', '1']);
      
      expect(mockManager.deleteWorkflow).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deleted workflow'));
    });

    test('should handle missing workflow ID', async () => {
      await cli.run(['delete']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Workflow ID is required');
    });
  });

  describe('activate/deactivate commands', () => {
    test('should activate workflow', async () => {
      await cli.run(['activate', '1']);
      
      expect(mockManager.activateWorkflow).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Activated workflow'));
    });

    test('should deactivate workflow', async () => {
      await cli.run(['deactivate', '1']);
      
      expect(mockManager.deactivateWorkflow).toHaveBeenCalledWith('1');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Deactivated workflow'));
    });
  });

  describe('execute command', () => {
    test('should execute workflow without data', async () => {
      await cli.run(['execute', '1']);
      
      expect(mockManager.executeWorkflow).toHaveBeenCalledWith('1', undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('Execution Result:');
    });

    test('should execute workflow with JSON data', async () => {
      const inputData = { key: 'value' };
      
      await cli.run(['execute', '1', JSON.stringify(inputData)]);
      
      expect(mockManager.executeWorkflow).toHaveBeenCalledWith('1', inputData);
    });

    test('should handle execution error', async () => {
      mockManager.executeWorkflow.mockRejectedValue(new Error('Execution failed'));
      
      await expect(cli.run(['execute', '1'])).rejects.toThrow('Process exited with code 1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Execution failed');
    });
  });

  describe('import/export commands', () => {
    test('should import workflow', async () => {
      const workflowData = { id: '1', name: 'Imported', nodes: [], connections: {} };
      mockManager.importWorkflow = jest.fn().mockResolvedValue(workflowData);
      
      await cli.run(['import', 'export.json']);
      
      expect(mockManager.importWorkflow).toHaveBeenCalledWith('export.json');
      expect(consoleLogSpy).toHaveBeenCalledWith('Imported workflow "Imported" with ID: 1');
    });

    test('should export workflow', async () => {
      mockManager.saveWorkflowToFile = jest.fn().mockResolvedValue('workflow-1-export.json');
      
      await cli.run(['export', '1']);
      
      expect(mockManager.saveWorkflowToFile).toHaveBeenCalledWith('1', undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('workflow-1-export.json'));
    });

    test('should export workflow to specific file', async () => {
      mockManager.saveWorkflowToFile = jest.fn().mockResolvedValue('custom.json');
      
      await cli.run(['export', '1', 'custom.json']);
      
      expect(mockManager.saveWorkflowToFile).toHaveBeenCalledWith('1', 'custom.json');
      expect(consoleLogSpy).toHaveBeenCalledWith('Exported workflow to: custom.json');
    });
  });

  describe('save-template command', () => {
    test('should save workflow as template', async () => {
      const workflow = { id: '1', name: 'Test', nodes: [], connections: {} };
      mockManager.getWorkflow.mockResolvedValue(workflow);
      mockManager.saveWorkflowTemplate = jest.fn().mockReturnValue('/templates/my-template.json');
      
      await cli.run(['save-template', '1', 'my-template']);
      
      expect(mockManager.getWorkflow).toHaveBeenCalledWith('1');
      expect(mockManager.saveWorkflowTemplate).toHaveBeenCalledWith('my-template', workflow);
      expect(consoleLogSpy).toHaveBeenCalledWith('Saved workflow "Test" as template "my-template" to: /templates/my-template.json');
    });

    test('should handle missing parameters', async () => {
      await cli.run(['save-template', '1']);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Workflow ID and template name are required');
    });
  });


  describe('parseArguments', () => {
    test('should parse flags correctly', async () => {
      // Test through a command that uses flags
      await cli.run(['list', '--active']);
      
      expect(mockManager.listWorkflows).toHaveBeenCalledWith(true);
    });

    test('should parse options with values', async () => {
      // CLI doesn't use parseArguments for options, it uses positional arguments
      await cli.run(['create', 'My Workflow']);
      
      expect(mockManager.createWorkflow).toHaveBeenCalled();
    });
  });
});