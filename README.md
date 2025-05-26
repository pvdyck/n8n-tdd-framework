# n8n-tdd-framework

A Test-Driven Development framework for n8n workflows that provides a standardized approach to testing n8n automation workflows.

> 📚 **Documentation**: [User Guide](./docs/README.md#-framework-user-documentation) | [Developer Guide](./docs/README.md#-framework-developer-documentation) | [Quick Start](./QUICKSTART.md)

## Overview

The n8n-tdd-framework transforms n8n workflow development by providing:
- **Test-Driven Development**: Write tests first, then build workflows that pass
- **Consistent Testing Methodology**: Standardized approach across all n8n projects
- **Simplified Installation**: One-command installation via npm
- **Centralized Maintenance**: Bug fixes and improvements benefit all projects
- **Professional Development Workflow**: CI/CD integration and semantic versioning

## What is TDD for n8n?

Test-Driven Development (TDD) for n8n means writing tests BEFORE creating your workflows. This approach ensures:

1. **Clear Requirements** - Tests define what the workflow should do
2. **Early Error Detection** - Catch issues before deployment
3. **Confident Refactoring** - Improve workflows without breaking functionality
4. **Living Documentation** - Tests document expected behavior

Learn more: [TDD Methodology Guide](./docs/n8n-tdd-methodology.md) | [Step-by-Step Tutorial](./docs/tutorials/tdd-step-by-step.md)

## Installation

```bash
npm install n8n-tdd-framework
```

## Key Benefits

### For Development Teams
- **Reduced Setup Time**: New projects operational in minutes instead of hours
- **Focus on Business Logic**: Teams concentrate on workflow logic rather than testing infrastructure
- **Knowledge Sharing**: Common framework facilitates team collaboration
- **Best Practices**: Encapsulates n8n testing best practices

### For Project Maintainers
- **Clear Separation**: Framework code isolated from project implementations
- **Version Control**: Semantic versioning for predictable updates
- **Automated Deployment**: CI/CD pipeline for reliable releases
- **Community Support**: Open source collaboration and issue tracking

## Features

- Create, read, update, and delete n8n workflows
- Manage n8n credentials securely with environment variables
- Import and export workflows to/from files
- Template-based workflow creation with built-in templates
- Declarative workflow testing with JSON configuration
- Docker management for n8n instances
- Command-line interface (CLI)
- Automatic retry logic with exponential backoff
- Rate limiting to prevent API overload
- Comprehensive error handling with custom error types
- Workflow validation before execution
- Built-in workflow templates for common patterns

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

All credentials in the framework are managed through environment variables for enhanced security. This ensures sensitive information is never hardcoded in your application.

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';

// Create a workflow manager
const manager = new WorkflowManager();

// Connect to n8n
await manager.connect();

// List credential types
const credentialTypes = await manager.listCredentialTypes();
console.log(`Available credential types: ${credentialTypes.length}`);

// List all credentials from environment variables
const envCredentials = manager.listCredentialsFromEnv();
console.log(`Found ${envCredentials.length} credential(s) in environment variables`);

// Create a credential from environment variables
// This will look for environment variables with the prefix N8N_CREDENTIAL_API_*
const credential = await manager.createCredentialFromEnv('API');
console.log(`Created credential with ID: ${credential.id}`);

// Check if a credential exists in environment variables
if (manager.hasCredentialInEnv('DATABASE')) {
  // Create the credential
  const dbCredential = await manager.createCredentialFromEnv('DATABASE');
}

// Get a credential by ID
const retrievedCredential = await manager.getCredential(credential.id!);

// Update a credential
await manager.updateCredential(credential.id!, {
  name: 'Updated API Credential'
});

// Delete a credential
await manager.deleteCredential(credential.id!);

// Disconnect from n8n
await manager.disconnect();
```

#### Defining Credentials in Environment Variables

To define credentials in environment variables, use the following format:

```
# Basic HTTP Auth Credential
N8N_CREDENTIAL_API_TYPE=httpBasicAuth
N8N_CREDENTIAL_API_USERNAME=myusername
N8N_CREDENTIAL_API_PASSWORD=mypassword

# OAuth2 Credential
N8N_CREDENTIAL_OAUTH_TYPE=oAuth2Api
N8N_CREDENTIAL_OAUTH_CLIENT_ID=myclientid
N8N_CREDENTIAL_OAUTH_CLIENT_SECRET=myclientsecret
```

The format is `N8N_CREDENTIAL_<NAME>_<PROPERTY>`, where:
- `<NAME>` is the credential name (e.g., API, OAUTH, DATABASE)
- `<PROPERTY>` is the property name (e.g., TYPE, USERNAME, PASSWORD)

The `TYPE` property is required and must match a valid n8n credential type.

#### Referencing Environment Variables in Credential Data

You can also reference other environment variables in credential data:

```typescript
// Create a credential with environment variable references
const credential: Credential = {
  name: 'My API Credential',
  type: 'httpBasicAuth',
  data: {
    username: '${API_USERNAME}',
    password: '${API_PASSWORD}'
  }
};

// The environment variables will be resolved when creating the credential
const createdCredential = await manager.createCredential(credential);
```

This allows you to reference sensitive information stored in environment variables without hardcoding them in your application.

### Test-Driven Workflow Development

Follow the TDD cycle: Red → Green → Refactor

#### 1. Write a Test First (Red)
```json
// tests/customer-sync.json
{
  "name": "Should sync customer to CRM",
  "input": {
    "email": "new@customer.com",
    "name": "New Customer"
  },
  "assertions": [{
    "description": "Should create customer in CRM",
    "assertion": "result.crmId !== undefined"
  }]
}
```

#### 2. Create Workflow to Pass Test (Green)
```typescript
// Implement minimal workflow that makes the test pass
const workflow = await manager.createWorkflowFromTemplate(
  'customer_sync',
  'Customer Sync Workflow'
);
```

#### 3. Run Tests and Refactor
```typescript
import { DeclarativeTestRunner } from 'n8n-tdd-framework';

const runner = new DeclarativeTestRunner({
  templatesDir: './templates',
  testsDir: './tests'
});

// Run tests to ensure they pass
const results = await runner.runTestsFromFile('./tests/customer-sync.json');
console.log(`Tests: ${results.passed}/${results.total} passed`);

// Now safe to refactor and optimize
```

### Declarative Testing

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
        "name": "API",
        "usedByWorkflow": "Test HTTP Workflow",
        "usedByNode": "HTTP Request"
      },
      {
        "name": "OAUTH",
        "usedByWorkflow": "Test HTTP Workflow",
        "usedByNode": "OAuth Request"
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

In this example, the credentials `API` and `OAUTH` will be loaded from environment variables. The framework will look for environment variables with the prefixes `N8N_CREDENTIAL_API_*` and `N8N_CREDENTIAL_OAUTH_*` to create these credentials.

Make sure to define these credentials in your `.env` file before running the tests:

```
# API Credential
N8N_CREDENTIAL_API_TYPE=httpBasicAuth
N8N_CREDENTIAL_API_USERNAME=testuser
N8N_CREDENTIAL_API_PASSWORD=testpass

# OAuth Credential
N8N_CREDENTIAL_OAUTH_TYPE=oAuth2Api
N8N_CREDENTIAL_OAUTH_CLIENT_ID=clientid
N8N_CREDENTIAL_OAUTH_CLIENT_SECRET=clientsecret
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


### CLI Usage

The framework includes a CLI for managing workflows:

```bash
# Install globally
npm install -g n8n-tdd-framework

# Workflow commands
n8n-tdd list                           # List all workflows
n8n-tdd get <id>                       # Get workflow details
n8n-tdd create <name> [template]       # Create a new workflow
n8n-tdd delete <id>                    # Delete a workflow
n8n-tdd activate <id>                  # Activate a workflow
n8n-tdd deactivate <id>                # Deactivate a workflow
n8n-tdd execute <id> [data]            # Execute a workflow
n8n-tdd export <id> [filename]         # Export a workflow to a file
n8n-tdd export-all [directory]         # Export all workflows to files
n8n-tdd import <filepath>              # Import a workflow from a file
n8n-tdd save-template <id> <name>      # Save a workflow as a template
n8n-tdd list-templates                 # List available templates

# Test command
n8n-tdd test <filepath>                # Run declarative tests from a file

# Docker commands (via separate Docker CLI)
n8n-tdd docker start                   # Start n8n Docker container
n8n-tdd docker stop                    # Stop n8n Docker container
n8n-tdd docker restart                 # Restart n8n Docker container
n8n-tdd docker status                  # Get n8n Docker container status
```

## Configuration

The framework can be configured using:

1. Environment variables:
   - `N8N_API_URL`: URL of the n8n API
   - `N8N_API_KEY`: API key for authentication
   - `N8N_TEMPLATES_DIR`: Directory for workflow templates
   - `N8N_TESTS_DIR`: Directory for test files
   - `N8N_CONTAINER_NAME`: Docker container name
   - `N8N_IMAGE`: Docker image for n8n
   - `N8N_PORT`: Port to expose n8n on

2. Configuration file (`n8n-tdd-config.json`):
   ```json
   {
     "apiUrl": "http://localhost:5678/api/v1",
     "templatesDir": "./templates",
     "testsDir": "./tests",
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
- `createCredential(credential: Credential)`: Create a new credential (environment variables are automatically resolved)
- `updateCredential(id: string, credential: Partial<Credential>)`: Update a credential (environment variables are automatically resolved)
- `deleteCredential(id: string)`: Delete a credential
- `createCredentialFromEnv(name: string, options?: { envPrefix?: string; envPath?: string })`: Create a credential from environment variables
- `createCredentialFromTestDefinition(testCredential: TestCredential)`: Create a credential from a test definition
- `listCredentialsFromEnv(options?: { envPrefix?: string; envPath?: string })`: List all credentials from environment variables
- `getCredentialFromEnv(name: string, options?: { envPrefix?: string; envPath?: string })`: Get a credential from environment variables
- `hasCredentialInEnv(name: string, options?: { envPrefix?: string; envPath?: string })`: Check if a credential exists in environment variables

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

## Advanced Features

### Error Handling

The framework provides custom error classes for better error handling:

```typescript
import { WorkflowManager, WorkflowError, ValidationError } from 'n8n-tdd-framework';

try {
  await manager.createWorkflow(workflow);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Workflow validation failed:', error.details);
  } else if (error instanceof WorkflowError) {
    console.error('Workflow operation failed:', error.message);
  }
}
```

### Retry Logic

API calls automatically retry with exponential backoff:

```typescript
const manager = new WorkflowManager({
  // Customize retry behavior
  maxRetries: 5,
  initialDelay: 2000
});
```

### Rate Limiting

The client includes built-in rate limiting:

```typescript
const client = new N8nClient({
  maxRequestsPerMinute: 30 // Default is 60
});
```

### Workflow Validation

Validate workflows before execution:

```typescript
const validationResult = manager.validateWorkflow(workflow);
if (!validationResult.valid) {
  console.error('Errors:', validationResult.errors);
  console.warn('Warnings:', validationResult.warnings);
}

// Validation is automatic during creation/execution
await manager.createWorkflow(workflow); // Throws ValidationError if invalid
```

### Built-in Templates

The framework includes several workflow templates:

- `webhook-to-email`: Webhook trigger that sends email notifications
- `scheduled-backup`: Daily scheduled backup workflow
- `api-health-check`: API health monitoring with alerts
- `data-transformation`: ETL pipeline for data processing
- `error-handler`: Global error handling workflow

Use templates:

```typescript
const workflow = await manager.createWorkflowFromTemplate(
  'api-health-check',
  'My Health Monitor'
);
```

## Project Structure

```
n8n-tdd-framework/
├── src/                    # Source code
│   ├── clients/           # n8n API clients
│   ├── config/            # Configuration management
│   ├── docker/            # Docker management
│   ├── interfaces/        # TypeScript interfaces
│   ├── workflows/         # Workflow management
│   │   └── testing/       # Declarative testing
│   └── index.ts          # Main exports
├── bin/                   # CLI executable
├── templates/             # Built-in workflow templates
├── examples/              # Usage examples
└── tests/                 # Framework tests
```

## Documentation

### TDD Resources
- [TDD Methodology for n8n](./docs/n8n-tdd-methodology.md) - Complete guide to Test-Driven Development with n8n
- [Step-by-Step TDD Tutorial](./docs/tutorials/tdd-step-by-step.md) - Build a complete workflow using TDD
- [TDD Example Project](./examples/tdd-example/README.md) - Weather alert system built with TDD

### Technical Documentation
- [API Documentation](./docs/planning/n8n-tdd-framework-api-docs.md) - Detailed API reference
- [Testing Strategy](./docs/planning/n8n-tdd-framework-testing-strategy.md) - Testing approach and guidelines
- [CI/CD Strategy](./n8n-tdd-framework-cicd.md) - Continuous integration setup
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Release history

## Roadmap

Upcoming features:
- **Coverage Tracking**: Workflow execution coverage reports
- **Parallel Testing**: Run multiple tests concurrently
- **Enhanced Templates**: Expanded template library
- **Plugin System**: Extensible architecture for custom functionality

See [Development Roadmap](./n8n-tdd-framework-next-steps.md) for details.

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details.

## License

ISC