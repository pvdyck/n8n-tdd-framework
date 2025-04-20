import { WorkflowManager } from 'n8n-tdd-framework';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Example of using the n8n-tdd-framework
 */
async function main() {
  // Create a workflow manager
  const manager = new WorkflowManager({
    // You can provide options here, or use environment variables
    // apiUrl: 'http://localhost:5678/api/v1',
    // apiKey: 'your-api-key',
    // templatesDir: './templates'
  });
  
  try {
    // Connect to n8n
    console.log('Connecting to n8n API...');
    await manager.connect();
    console.log('Connected to n8n API');
    
    // List all workflows
    console.log('\nListing all workflows...');
    const workflows = await manager.listWorkflows();
    console.log(`Found ${workflows.length} workflow(s):`);
    
    workflows.forEach(workflow => {
      console.log(`- ${workflow.name} (ID: ${workflow.id}, Active: ${workflow.active})`);
    });
    
    // Create a simple workflow
    console.log('\nCreating a new workflow...');
    const newWorkflow = await manager.createWorkflow({
      name: 'Example Workflow',
      nodes: [
        {
          name: 'Start',
          type: 'n8n-nodes-base.start',
          position: [100, 300],
          parameters: {}
        },
        {
          name: 'Set',
          type: 'n8n-nodes-base.set',
          position: [280, 300],
          parameters: {
            values: [
              {
                name: 'message',
                value: 'Hello from n8n-tdd-framework!'
              }
            ]
          }
        }
      ],
      connections: {
        Start: {
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
    
    console.log(`Created workflow "${newWorkflow.name}" with ID: ${newWorkflow.id}`);
    
    // Execute the workflow
    console.log('\nExecuting the workflow...');
    const result = await manager.executeWorkflow(newWorkflow.id!);
    console.log('Execution result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Save the workflow to a file
    console.log('\nSaving the workflow to a file...');
    const filePath = await manager.saveWorkflowToFile(newWorkflow.id!);
    console.log(`Saved workflow to: ${filePath}`);
    
    // Clean up - delete the workflow
    console.log('\nDeleting the workflow...');
    await manager.deleteWorkflow(newWorkflow.id!);
    console.log(`Deleted workflow with ID: ${newWorkflow.id}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from n8n
    console.log('\nDisconnecting from n8n API...');
    await manager.disconnect();
    console.log('Disconnected from n8n API');
  }
}

// Run the example
main().catch(console.error);