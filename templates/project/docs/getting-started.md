# Getting Started with n8n TDD Framework

This guide will help you get started with testing your n8n workflows using the TDD framework.

## Prerequisites

- Node.js 14+ installed
- Docker installed (for running n8n locally)
- Basic knowledge of n8n workflows
- Basic knowledge of Jest testing framework

## Initial Setup

### 1. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file and set your configuration:

```env
# Required: Set your n8n API key
N8N_API_KEY=your-actual-api-key

# Optional: Change the port if needed
N8N_PORT=5678
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start n8n Container

Start the n8n instance using Docker:

```bash
npm run docker:start
```

Wait for the container to be healthy:

```bash
npm run docker:status
```

### 4. Access n8n UI

Open your browser and go to:
- URL: http://localhost:5678
- Use the API key from your `.env` file when needed

## Writing Your First Test

### Option 1: Declarative Testing (JSON-based)

Create a test file in `tests/declarative/my-workflow-test.json`:

```json
{
  "name": "My Workflow Test",
  "description": "Test my custom workflow",
  "workflow": {
    "path": "workflows/my-workflow.json"
  },
  "input": {
    "data": {
      "name": "Test User",
      "email": "test@example.com"
    }
  },
  "assertions": [
    {
      "type": "execution",
      "expected": {
        "finished": true,
        "status": "success"
      }
    },
    {
      "type": "node-output",
      "nodeName": "Process Data",
      "expected": {
        "data": {
          "processed": true,
          "name": "Test User"
        }
      }
    }
  ]
}
```

Run the test:

```bash
npm run test:declarative
```

### Option 2: Programmatic Testing (TypeScript)

Create a test file in `tests/unit/my-workflow.test.ts`:

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';

describe('My Workflow', () => {
  let manager: WorkflowManager;
  let workflowId: string;
  
  beforeAll(async () => {
    manager = new WorkflowManager();
    await manager.connect();
    
    // Create or import your workflow
    const workflow = await manager.createWorkflow({
      name: 'Test Workflow',
      nodes: [...],
      connections: {...}
    });
    workflowId = workflow.id!;
  });
  
  afterAll(async () => {
    await manager.deleteWorkflow(workflowId);
    await manager.disconnect();
  });
  
  it('should process data correctly', async () => {
    const input = { name: 'Test User', email: 'test@example.com' };
    const execution = await manager.executeWorkflow(workflowId, input);
    
    expect(execution.finished).toBe(true);
    
    // Check specific node output
    const output = execution.data?.resultData?.runData?.['Process Data'];
    expect(output[0].data.main[0][0].json).toMatchObject({
      processed: true,
      name: 'Test User'
    });
  });
});
```

Run the test:

```bash
npm test
```

## Working with Credentials

### Setting Up Test Credentials

Add credentials to your `.env` file:

```env
# HTTP Basic Auth
N8N_CREDENTIAL_my_api_TYPE=httpBasicAuth
N8N_CREDENTIAL_my_api_username=testuser
N8N_CREDENTIAL_my_api_password=testpass

# PostgreSQL Database
N8N_CREDENTIAL_test_db_TYPE=postgres
N8N_CREDENTIAL_test_db_host=localhost
N8N_CREDENTIAL_test_db_port=5432
N8N_CREDENTIAL_test_db_database=testdb
N8N_CREDENTIAL_test_db_user=testuser
N8N_CREDENTIAL_test_db_password=testpass
```

### Using Credentials in Tests

```typescript
// The framework automatically creates credentials from env vars
const workflow = await manager.createWorkflow({
  name: 'API Test',
  nodes: [
    {
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      credentials: {
        httpBasicAuth: {
          id: 'my_api',  // Matches N8N_CREDENTIAL_my_api_*
          name: 'my_api'
        }
      },
      // ... other node properties
    }
  ]
});
```

## Test Patterns

### Testing HTTP APIs

```typescript
it('should fetch user data from API', async () => {
  const execution = await manager.executeWorkflow(workflowId);
  const httpNode = execution.data?.resultData?.runData?.['HTTP Request'];
  
  expect(httpNode[0].data.main[0][0].json).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    email: expect.any(String)
  });
});
```

### Testing Database Operations

```typescript
it('should insert and retrieve data from database', async () => {
  const testData = { name: 'Test User', email: 'test@example.com' };
  
  // Execute workflow with test data
  const execution = await manager.executeWorkflow(workflowId, testData);
  
  // Verify insert operation
  const insertNode = execution.data?.resultData?.runData?.['Insert Data'];
  expect(insertNode[0].error).toBeUndefined();
  
  // Verify select operation
  const selectNode = execution.data?.resultData?.runData?.['Select Data'];
  const results = selectNode[0].data.main[0];
  
  expect(results).toContainEqual(
    expect.objectContaining(testData)
  );
});
```

### Testing Error Handling

```typescript
it('should handle API errors gracefully', async () => {
  // Use a workflow configured to hit a non-existent endpoint
  const execution = await manager.executeWorkflow(errorWorkflowId);
  
  expect(execution.finished).toBe(true);
  
  const errorHandler = execution.data?.resultData?.runData?.['Error Handler'];
  expect(errorHandler).toBeDefined();
  expect(errorHandler[0].data.main[0][0].json).toMatchObject({
    error: expect.any(String),
    handled: true
  });
});
```

## Running Tests

### Unit Tests
```bash
npm test                    # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Integration Tests
```bash
npm run test:integration   # Run integration tests (requires n8n running)
```

### Declarative Tests
```bash
npm run test:declarative   # Run all declarative tests
n8n-tdd test tests/declarative/specific-test.json  # Run specific test
```

## Debugging Tests

### VS Code Debugging

1. Open VS Code
2. Set breakpoints in your test files
3. Go to Run and Debug (Cmd/Ctrl + Shift + D)
4. Select "Debug Jest Tests" or "Debug Current Test File"
5. Press F5 to start debugging

### Console Logging

```typescript
it('should process data', async () => {
  const execution = await manager.executeWorkflow(workflowId);
  
  // Log the entire execution result
  console.log(JSON.stringify(execution, null, 2));
  
  // Log specific node output
  const nodeData = execution.data?.resultData?.runData?.['My Node'];
  console.log('Node output:', nodeData[0].data.main[0][0].json);
});
```

## Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Clean up resources** in afterAll/afterEach hooks
3. **Use test data fixtures** for consistent test data
4. **Test both success and error scenarios**
5. **Keep tests independent** - each test should run in isolation
6. **Use environment variables** for sensitive data
7. **Mock external services** when appropriate
8. **Run tests in CI/CD** pipeline

## Troubleshooting

### Container won't start
- Check Docker is running: `docker ps`
- Check logs: `docker logs <container-name>`
- Ensure port 5678 is not in use: `lsof -i :5678`

### Tests failing with connection errors
- Verify n8n is running: `npm run docker:status`
- Check API key is set correctly in `.env`
- Verify API URL is correct

### Credentials not working
- Check environment variable names match the pattern: `N8N_CREDENTIAL_<name>_<property>`
- Ensure credential type is correct
- Verify credentials in n8n UI

## Next Steps

- Explore the example workflows in `workflows/examples/`
- Read about [Advanced Testing Patterns](./advanced-patterns.md)
- Learn about [CI/CD Integration](./ci-cd-integration.md)
- Check out [Troubleshooting Guide](./troubleshooting.md)