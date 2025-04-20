# n8n-tdd-framework

A Test-Driven Development framework for n8n workflows.

## Installation

```bash
npm install n8n-tdd-framework
```

## Features

- Create, read, update, and delete n8n workflows
- Import and export workflows to/from files
- Template-based workflow creation
- Declarative workflow testing
- CI/CD integration

## Usage

### Basic Usage

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';

// Create a workflow manager
const manager = new WorkflowManager();

// Connect to n8n
await manager.connect();

// List all workflows
const workflows = await manager.listWorkflows();
console.log(`Found ${workflows.length} workflow(s)`);

// Create a workflow
const workflow = await manager.createWorkflow({
  name: 'My Workflow',
  nodes: [],
  connections: {}
});

// Execute a workflow
const result = await manager.executeWorkflow(workflow.id);

// Disconnect from n8n
await manager.disconnect();
```

### Workflow Templates

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';

const manager = new WorkflowManager({
  templatesDir: './templates'
});

// Create a workflow from a template
const workflow = await manager.createWorkflowFromTemplate(
  'http_request',
  'My HTTP Workflow'
);

// Save a workflow as a template
await manager.saveWorkflowTemplate('my_template', workflow);

// List available templates
const templates = manager.listWorkflowTemplates();
```

### Declarative Testing

```typescript
import { DeclarativeTestRunner } from 'n8n-tdd-framework';

// Create a test runner
const runner = new DeclarativeTestRunner({
  templatesDir: './templates',
  testsDir: './tests'
});

// Run tests from a file
const results = await runner.runTestsFromFile('./tests/my-test.json');
console.log(`Tests: ${results.passed}/${results.total} passed`);

// Run all tests in a directory
const allResults = await runner.runTestsFromDirectory('./tests');
```

Example test file (JSON):

```json
[
  {
    "name": "HTTP Request Test",
    "workflows": [
      {
        "templateName": "http_request",
        "name": "Test HTTP Workflow",
        "isPrimary": true
      }
    ],
    "input": {
      "url": "https://example.com"
    },
    "assertions": [
      {
        "description": "Response should be successful",
        "assertion": "result && result.success === true"
      },
      {
        "description": "Response should contain data",
        "assertion": "result && result.data && typeof result.data === 'object'"
      }
    ]
  }
]
```

### CLI Usage

The framework includes a CLI for managing workflows:

```bash
# Install globally
npm install -g n8n-tdd-framework

# List all workflows
n8n-tdd list

# Create a workflow from a template
n8n-tdd create "My Workflow" http_request

# Execute a workflow
n8n-tdd execute workflow-id

# Run tests
n8n-tdd test ./tests/my-test.json
```

## Configuration

The framework can be configured using:

1. Environment variables:
   - `N8N_API_URL`: URL of the n8n API
   - `N8N_API_KEY`: API key for authentication
   - `N8N_TEMPLATES_DIR`: Directory for workflow templates
   - `N8N_TESTS_DIR`: Directory for test files

2. Configuration file (`n8n-tdd-config.json`):
   ```json
   {
     "apiUrl": "http://localhost:5678/api/v1",
     "templatesDir": "./templates",
     "testsDir": "./tests"
   }
   ```

3. Constructor options:
   ```typescript
   const manager = new WorkflowManager({
     apiUrl: "http://localhost:5678/api/v1",
     apiKey: "your-api-key",
     templatesDir: "./templates"
   });
   ```

## API Reference

### WorkflowManager

The `WorkflowManager` class provides methods for managing n8n workflows:

- `connect()`: Connect to the n8n API
- `disconnect()`: Disconnect from the n8n API
- `listWorkflows(active?: boolean)`: List all workflows
- `getWorkflow(id: string)`: Get a workflow by ID
- `createWorkflow(workflow: Workflow)`: Create a new workflow
- `updateWorkflow(id: string, workflow: Partial<Workflow>)`: Update a workflow
- `deleteWorkflow(id: string)`: Delete a workflow
- `activateWorkflow(id: string)`: Activate a workflow
- `deactivateWorkflow(id: string)`: Deactivate a workflow
- `executeWorkflow(id: string, data?: any)`: Execute a workflow
- `saveWorkflowToFile(id: string, filename?: string)`: Save a workflow to a file
- `loadWorkflowFromFile(filePath: string)`: Load a workflow from a file
- `importWorkflow(filePath: string)`: Import a workflow from a file
- `exportAllWorkflows(outputDir?: string)`: Export all workflows to files
- `saveWorkflowTemplate(name: string, workflow: Workflow)`: Save a workflow as a template
- `loadWorkflowTemplate(name: string)`: Load a workflow template
- `createWorkflowFromTemplate(templateName: string, workflowName: string, settings?: Record<string, any>)`: Create a workflow from a template
- `listWorkflowTemplates()`: List all workflow templates

### DeclarativeTestRunner

The `DeclarativeTestRunner` class provides methods for running declarative tests:

- `runTest(testCase: TestCase)`: Run a single test case
- `runTests(testCases: TestCase[])`: Run multiple test cases
- `runTestsFromFile(filePath: string)`: Run tests from a file
- `runTestsFromDirectory(dirPath?: string)`: Run tests from a directory

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC