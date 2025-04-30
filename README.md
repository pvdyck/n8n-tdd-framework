# n8n-tdd-framework

A Test-Driven Development framework for n8n workflows.

## Installation

```bash
npm install n8n-tdd-framework
```

## Features

- Create, read, update, and delete n8n workflows
- Manage n8n credentials securely
- Import and export workflows to/from files
- Template-based workflow creation
- Declarative workflow testing
- Comprehensive coverage tracking and reporting
- Docker management for n8n instances
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

### Credential Management

```typescript
import { WorkflowManager, Credential } from 'n8n-tdd-framework';

// Create a workflow manager
const manager = new WorkflowManager();

// Connect to n8n
await manager.connect();

// List credential types
const credentialTypes = await manager.listCredentialTypes();
console.log(`Available credential types: ${credentialTypes.length}`);

// Create a credential
const credential: Credential = {
  name: 'My API Credential',
  type: 'httpBasicAuth',
  data: {
    username: 'user',
    password: 'pass'
  }
};

const createdCredential = await manager.createCredential(credential);
console.log(`Created credential with ID: ${createdCredential.id}`);

// List all credentials
const credentials = await manager.listCredentials();
console.log(`Found ${credentials.length} credential(s)`);

// Get a credential by ID
const retrievedCredential = await manager.getCredential(createdCredential.id!);

// Update a credential
await manager.updateCredential(createdCredential.id!, {
  name: 'Updated API Credential'
});

// Delete a credential
await manager.deleteCredential(createdCredential.id!);

// Disconnect from n8n
await manager.disconnect();
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
    "credentials": [
      {
        "name": "API Credential",
        "type": "httpBasicAuth",
        "data": {
          "username": "testuser",
          "password": "testpass"
        },
        "usedByWorkflow": "Test HTTP Workflow",
        "usedByNode": "HTTP Request"
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

### Docker Management

The framework provides Docker management for n8n instances:

```typescript
import { createDockerManager, DockerContainerConfig } from 'n8n-tdd-framework';

// Configure Docker container
const config: DockerContainerConfig = {
  containerName: 'n8n',
  image: 'n8nio/n8n',
  port: 5678,
  apiKey: 'your-api-key',
  dataDir: './n8n_data',
  env: {
    N8N_DIAGNOSTICS_ENABLED: 'false',
    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false'
  },
  volumes: [
    './custom-nodes:/home/node/.n8n/custom-nodes'
  ]
};

// Create Docker manager
const dockerManager = createDockerManager(config);

// Start n8n container
await dockerManager.start();

// Check container status
const status = await dockerManager.status();
console.log(`Container running: ${status.running}`);
console.log(`API accessible: ${status.apiAccessible}`);

// Stop n8n container
await dockerManager.stop();
```

### Coverage Tracking

The framework provides comprehensive coverage tracking for n8n workflows:

```typescript
import {
  DeclarativeTestRunner,
  CoverageTracker,
  CoverageOptions
} from 'n8n-tdd-framework';

// Create a coverage tracker
const coverageOptions: CoverageOptions = {
  enabled: true,
  format: 'all', // 'console', 'json', 'html', or 'all'
  outputDir: './coverage',
  thresholds: {
    nodes: 80,
    connections: 70,
    branches: 60
  },
  dashboard: {
    enabled: true,
    outputDir: './public'
  }
};

const coverageTracker = new CoverageTracker(coverageOptions);

// Create a test runner with coverage tracking
const runner = new DeclarativeTestRunner({
  templatesDir: './templates',
  testsDir: './tests',
  coverageTracker
});

// Run tests with coverage
const results = await runner.runTestsFromFile('./tests/my-test.json');

// Generate coverage report
coverageTracker.generateReport();

// Check if coverage meets thresholds
const coverageData = coverageTracker.getCoverageData();
console.log(`Node Coverage: ${coverageData.summary.overallNodeCoverage.toFixed(2)}%`);
console.log(`Connection Coverage: ${coverageData.summary.overallConnectionCoverage.toFixed(2)}%`);
console.log(`Branch Coverage: ${coverageData.summary.overallBranchCoverage.toFixed(2)}%`);
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

# Coverage commands
n8n-tdd coverage:check                # Check coverage thresholds
n8n-tdd coverage:dashboard            # Generate coverage dashboard
n8n-tdd coverage:clean                # Clean up coverage files

# Docker commands
n8n-tdd docker:start                  # Start n8n Docker container
n8n-tdd docker:stop                   # Stop n8n Docker container
n8n-tdd docker:restart                # Restart n8n Docker container
n8n-tdd docker:status                 # Get n8n Docker container status
n8n-tdd docker:help                   # Show Docker help
```

## Configuration

The framework can be configured using:

1. Environment variables:
   - `N8N_API_URL`: URL of the n8n API
   - `N8N_API_KEY`: API key for authentication
   - `N8N_TEMPLATES_DIR`: Directory for workflow templates
   - `N8N_TESTS_DIR`: Directory for test files
   - `N8N_COVERAGE_ENABLED`: Enable coverage tracking (true/false)
   - `N8N_COVERAGE_FORMAT`: Coverage report format (console/json/html/all)
   - `N8N_COVERAGE_OUTPUT_DIR`: Directory for coverage reports
   - `N8N_CONTAINER_NAME`: Docker container name
   - `N8N_IMAGE`: Docker image for n8n
   - `N8N_PORT`: Port to expose n8n on

2. Configuration file (`n8n-tdd-config.json`):
   ```json
   {
     "apiUrl": "http://localhost:5678/api/v1",
     "templatesDir": "./templates",
     "testsDir": "./tests",
     "coverage": {
       "enabled": true,
       "format": "all",
       "outputDir": "./coverage",
       "thresholds": {
         "nodes": 80,
         "connections": 70,
         "branches": 60
       }
     },
     "docker": {
       "containerName": "n8n",
       "image": "n8nio/n8n",
       "port": 5678,
       "dataDir": "./n8n_data"
     }
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

The `WorkflowManager` class provides methods for managing n8n workflows and credentials:

- `connect()`: Connect to the n8n API
- `disconnect()`: Disconnect from the n8n API

**Workflow Management:**
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

**Credential Management:**
- `listCredentialTypes()`: List all credential types
- `listCredentials()`: List all credentials
- `getCredential(id: string)`: Get a credential by ID
- `createCredential(credential: Credential)`: Create a new credential
- `updateCredential(id: string, credential: Partial<Credential>)`: Update a credential
- `deleteCredential(id: string)`: Delete a credential

### DockerManager

The `DockerManager` interface provides methods for managing n8n Docker containers:

- `start()`: Start n8n container
- `stop()`: Stop and remove n8n container
- `restart()`: Restart n8n container
- `status()`: Get n8n container status
- `isRunning()`: Check if n8n is running and accessible
- `waitForHealth(timeout?: number)`: Wait for n8n to be healthy

### DeclarativeTestRunner

The `DeclarativeTestRunner` class provides methods for running declarative tests:

- `runTest(testCase: TestCase)`: Run a single test case
- `runTests(testCases: TestCase[])`: Run multiple test cases
- `runTestsFromFile(filePath: string)`: Run tests from a file
- `runTestsFromDirectory(dirPath?: string)`: Run tests from a directory

### CoverageTracker

The `CoverageTracker` class provides methods for tracking and reporting coverage:

- `addTestResult(testResult: TestResultWithCoverage)`: Add a test result with coverage
- `addTestResults(testResults: TestResultWithCoverage[])`: Add multiple test results with coverage
- `merge(tracker: CoverageTracker)`: Merge coverage data from another tracker
- `getCoverageData()`: Get coverage data
- `generateReport()`: Generate coverage report
- `saveCoverageData()`: Save coverage data to file

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC