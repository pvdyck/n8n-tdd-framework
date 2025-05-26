import { WorkflowManager } from 'n8n-tdd-framework';
import * as path from 'path';

describe('Integration: Workflow Lifecycle', () => {
  let manager: WorkflowManager;
  
  beforeAll(async () => {
    manager = new WorkflowManager({
      apiUrl: process.env.N8N_API_URL || 'http://localhost:5678/api/v1',
      apiKey: process.env.N8N_API_KEY || 'test-integration-key'
    });
    await manager.connect();
  });
  
  afterAll(async () => {
    await manager.disconnect();
  });
  
  describe('Complete Workflow Lifecycle', () => {
    let workflowId: string;
    
    it('should create a new workflow', async () => {
      const workflow = await manager.createWorkflow({
        name: 'Integration Test Workflow',
        nodes: [
          {
            parameters: {},
            id: 'start-node',
            name: 'Start',
            type: 'n8n-nodes-base.start',
            typeVersion: 1,
            position: [250, 300]
          },
          {
            parameters: {
              values: {
                string: [
                  {
                    name: 'test',
                    value: 'Integration test successful!'
                  }
                ]
              }
            },
            id: 'set-node',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 2,
            position: [450, 300]
          }
        ],
        connections: {
          'Start': {
            main: [
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
      });
      
      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Integration Test Workflow');
      
      workflowId = workflow.id!;
    });
    
    it('should retrieve the created workflow', async () => {
      const workflow = await manager.getWorkflow(workflowId);
      
      expect(workflow).toBeDefined();
      expect(workflow.id).toBe(workflowId);
      expect(workflow.name).toBe('Integration Test Workflow');
      expect(workflow.nodes).toHaveLength(2);
    });
    
    it('should update the workflow', async () => {
      const updatedWorkflow = await manager.updateWorkflow(workflowId, {
        name: 'Updated Integration Test Workflow'
      });
      
      expect(updatedWorkflow.name).toBe('Updated Integration Test Workflow');
    });
    
    it('should execute the workflow', async () => {
      const execution = await manager.executeWorkflow(workflowId);
      
      expect(execution).toBeDefined();
      expect(execution.finished).toBe(true);
      
      // Check the output
      const setNodeData = execution.data?.resultData?.runData?.['Set']?.[0]?.data?.main?.[0]?.[0]?.json;
      expect(setNodeData).toEqual({
        test: 'Integration test successful!'
      });
    });
    
    it('should activate the workflow', async () => {
      const activated = await manager.activateWorkflow(workflowId);
      
      expect(activated.active).toBe(true);
    });
    
    it('should deactivate the workflow', async () => {
      const deactivated = await manager.deactivateWorkflow(workflowId);
      
      expect(deactivated.active).toBe(false);
    });
    
    it('should delete the workflow', async () => {
      const deleted = await manager.deleteWorkflow(workflowId);
      
      expect(deleted).toBe(true);
      
      // Verify it's gone
      await expect(manager.getWorkflow(workflowId)).rejects.toThrow();
    });
  });
  
  describe('Workflow Import/Export', () => {
    it('should import and execute a workflow from file', async () => {
      const workflowPath = path.join(__dirname, '../../workflows/examples/http-request.json');
      const workflow = await manager.importWorkflow(workflowPath);
      
      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      
      // Execute the imported workflow
      const execution = await manager.executeWorkflow(workflow.id!);
      expect(execution.finished).toBe(true);
      
      // Clean up
      await manager.deleteWorkflow(workflow.id!);
    });
  });
});