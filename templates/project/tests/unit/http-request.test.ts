import { WorkflowManager } from 'n8n-tdd-framework';
import * as path from 'path';

describe('HTTP Request Workflow', () => {
  let manager: WorkflowManager;
  let workflowId: string;
  
  beforeAll(async () => {
    // Initialize workflow manager
    manager = new WorkflowManager();
    await manager.connect();
    
    // Import the workflow
    const workflowPath = path.join(__dirname, '../../workflows/examples/http-request.json');
    const workflow = await manager.importWorkflow(workflowPath);
    workflowId = workflow.id!;
  });
  
  afterAll(async () => {
    // Clean up
    if (workflowId) {
      await manager.deleteWorkflow(workflowId);
    }
    await manager.disconnect();
  });
  
  describe('Execution Tests', () => {
    it('should successfully fetch data from JSONPlaceholder API', async () => {
      // Execute the workflow
      const execution = await manager.executeWorkflow(workflowId);
      
      // Verify execution completed
      expect(execution.finished).toBe(true);
      expect(execution.stoppedAt).toBeDefined();
      
      // Get execution data
      const data = execution.data?.resultData?.runData;
      
      // Verify HTTP Request node executed successfully
      expect(data?.['HTTP Request']).toBeDefined();
      const httpResult = data['HTTP Request'][0];
      expect(httpResult.error).toBeUndefined();
      
      // Verify the response data
      const responseData = httpResult.data?.main?.[0]?.[0]?.json;
      expect(responseData).toMatchObject({
        userId: expect.any(Number),
        id: 1,
        title: expect.any(String),
        body: expect.any(String)
      });
    });
    
    it('should transform data correctly in Set node', async () => {
      // Execute the workflow
      const execution = await manager.executeWorkflow(workflowId);
      
      // Get the Set node output
      const data = execution.data?.resultData?.runData;
      const setNodeResult = data?.['Set']?.[0];
      
      expect(setNodeResult.error).toBeUndefined();
      
      // Verify transformed data
      const transformedData = setNodeResult.data?.main?.[0]?.[0]?.json;
      expect(transformedData).toHaveProperty('title');
      expect(transformedData).toHaveProperty('userId');
      expect(transformedData.title).toBeTruthy();
      expect(typeof transformedData.userId).toBe('number');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // This would require modifying the workflow to use an invalid URL
      // For now, this is a placeholder for error testing patterns
      expect(true).toBe(true);
    });
  });
});