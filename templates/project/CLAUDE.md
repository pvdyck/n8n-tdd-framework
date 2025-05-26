# CLAUDE.md - n8n Workflow Testing Project Guide (2025 Edition)

This file helps Claude Code understand how to work with n8n workflows and implement Test-Driven Development practices in this testing project, incorporating the latest n8n features and community best practices.

## Project Overview

This is an n8n workflow testing project using the n8n-tdd-framework. The primary goal is to create reliable, tested n8n workflows following TDD principles, leveraging modern AI-powered development tools and enterprise-grade features.

### Project Structure
```
├── workflows/           # n8n workflow JSON files
│   ├── templates/      # Reusable workflow templates
│   └── subworkflows/   # Modular subworkflow components
├── tests/              # Test files
│   ├── unit/           # Unit tests for individual nodes
│   ├── integration/    # Integration tests for complete workflows
│   ├── declarative/    # JSON-based declarative tests
│   └── performance/    # Load and performance tests
├── fixtures/           # Test data and mock responses
│   ├── data/          # JSON test data files
│   ├── pinned/        # Pinned execution data for testing
│   └── credentials/   # Credential templates (never commit real credentials)
├── docs/              # Project documentation
├── .env.example       # Environment variable template
└── n8n-tdd-config.json # Framework configuration
```

## n8n Workflow Fundamentals

### Data Structure in n8n

**CRITICAL**: All data in n8n workflows must be in this format:
```javascript
[
  {
    "json": {
      "your": "data",
      "goes": "here"
    }
  }
]
```

- n8n uses an **array of objects** structure
- Each object MUST have a `json` key
- Binary data is stored separately in a `binary` key
- Multiple items are processed as array elements
- **New**: Task Runners can process data up to 6x faster in external processes

### Core Node Types

#### 1. Trigger Nodes (Start Points)

**Manual Trigger**
- Use for testing and on-demand execution
- No configuration needed
- Always outputs empty item: `[{ "json": {} }]`
- **TIP**: Use with pinned data for consistent testing

**Webhook Trigger**
```json
{
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "unique-webhook-path",
    "httpMethod": "POST",
    "responseMode": "onReceived",
    "responseData": "allEntries",
    "options": {
      "responseHeaders": {
        "entries": {
          "Access-Control-Allow-Origin": "*"
        }
      }
    }
  }
}
```

**Schedule Trigger (Cron)**
```json
{
  "name": "Schedule",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "hours",
          "hoursInterval": 1
        }
      ]
    }
  }
}
```

#### 2. AI-Powered Nodes (NEW)

**AI Transform Node** - Generate code from natural language
```json
{
  "name": "AI Transform",
  "type": "n8n-nodes-base.aiTransform",
  "parameters": {
    "instructions": "Group items by category and sum their prices",
    "model": "gpt-4"
  }
}
```

**AI Agent Node** - Build intelligent workflows
```json
{
  "name": "AI Agent",
  "type": "@n8n/n8n-nodes-langchain.agent",
  "parameters": {
    "model": "claude-3",
    "memory": true,
    "tools": ["webBrowser", "calculator"]
  }
}
```

#### 3. Data Processing Nodes

**Set Node** - Create or modify data
```json
{
  "name": "Set",
  "type": "n8n-nodes-base.set",
  "parameters": {
    "mode": "manual",
    "values": {
      "string": [
        {
          "name": "status",
          "value": "active"
        }
      ],
      "number": [
        {
          "name": "count",
          "value": 42
        }
      ]
    },
    "options": {
      "dotNotation": true
    }
  }
}
```

**Code Node** - JavaScript processing with Task Runners
```json
{
  "name": "Code",
  "type": "n8n-nodes-base.code",
  "parameters": {
    "mode": "runOnceForAllItems",
    "jsCode": "// Task Runners execute this in isolated process\n// Available variables:\n// $input.all() - all items\n// $input.item - current item (in 'runOnceForEachItem' mode)\n// NEW: Can use npm packages in self-hosted environments\n\nconst _ = require('lodash'); // With Task Runners enabled\n\nreturn $input.all().map(item => ({\n  json: {\n    processed: true,\n    original: item.json,\n    grouped: _.groupBy([item.json], 'category')\n  }\n}));"
  }
}
```

**Debug Helper Node** - Generate test data (NEW)
```json
{
  "name": "Debug Helper",
  "type": "n8n-nodes-base.debugHelper",
  "parameters": {
    "mode": "generateData",
    "dataType": "mixed",
    "jsonData": {
      "uuid": "{{ $uuid }}",
      "email": "{{ $randomEmail }}",
      "date": "{{ $now }}"
    }
  }
}
```

#### 4. Error Handling Nodes

**Error Trigger** - Catch workflow errors
```json
{
  "name": "Error Trigger",
  "type": "n8n-nodes-base.errorTrigger",
  "position": [250, 300]
}
```

**Stop and Error Node** - Controlled error generation
```json
{
  "name": "Stop and Error",
  "type": "n8n-nodes-base.stopAndError",
  "parameters": {
    "errorMessage": "=Validation failed: {{ $json.error }}"
  }
}
```

### n8n Expressions (Enhanced)

Use expressions to access dynamic data:
```javascript
{{ $json.fieldName }}                    // Current item's field
{{ $node["Node Name"].json.field }}      // Data from specific node
{{ $workflow.name }}                      // Workflow metadata
{{ $execution.id }}                       // Current execution ID
{{ DateTime.now().toISO() }}              // Luxon date functions
{{ $env.MY_ENV_VAR }}                     // Environment variables
{{ $secrets.vault.secret-name }}          // External secrets (NEW)
{{ $binary.data.fileName }}               // Binary file info
{{ $itemIndex }}                          // Current item index
{{ $runIndex }}                           // Current run index (loops)
```

## TDD Workflow Development Process (Modern Approach)

### 1. Define Test Scenarios with Data Pinning

**Pin execution data** for consistent testing:
1. Execute workflow with real data
2. Click "Pin" on node output
3. Pinned data replays in every execution
4. Store pinned data in `fixtures/pinned/` for version control

### 2. Create Declarative Tests

**Declarative Test Example** (`tests/declarative/api-transform-test.json`):
```json
{
  "name": "AI Transform Integration Test",
  "description": "Test AI-powered data transformation",
  "workflows": [
    {
      "templateName": "ai-data-processor",
      "name": "Test AI Transform Workflow",
      "credentials": {
        "openAiApi": "test_openai"
      }
    }
  ],
  "pinnedData": {
    "Start": "fixtures/pinned/sample-input.json"
  },
  "inputs": {
    "webhookData": {
      "items": [
        {"category": "A", "value": 10},
        {"category": "B", "value": 20},
        {"category": "A", "value": 30}
      ]
    }
  },
  "assertions": [
    {
      "type": "execution-success",
      "expected": true
    },
    {
      "type": "node-output",
      "nodeName": "AI Transform",
      "path": "json.categories.A.total",
      "expected": 40
    },
    {
      "type": "performance",
      "maxExecutionTime": 5000
    }
  ]
}
```

### 3. Implement Unit Tests with Debug Helper

**Unit Test Example** (`tests/unit/data-processor.test.ts`):
```typescript
import { WorkflowManager } from 'n8n-tdd-framework';
import { DebugHelper } from 'n8n-tdd-framework/helpers';

describe('Data Processing Workflow', () => {
  let manager: WorkflowManager;
  let workflowId: string;
  
  beforeAll(async () => {
    manager = new WorkflowManager();
    await manager.connect();
  });
  
  afterAll(async () => {
    if (workflowId) {
      await manager.deleteWorkflow(workflowId);
    }
    await manager.disconnect();
  });
  
  it('should transform data with AI assistance', async () => {
    // Arrange - Create workflow with Debug Helper
    const workflow = {
      name: 'AI Transform Test',
      nodes: [
        {
          name: 'Start',
          type: 'n8n-nodes-base.manualTrigger',
          position: [250, 300]
        },
        {
          name: 'Generate Test Data',
          type: 'n8n-nodes-base.debugHelper',
          position: [450, 300],
          parameters: {
            mode: 'generateData',
            dataType: 'customerData',
            numberItems: 100
          }
        },
        {
          name: 'AI Transform',
          type: 'n8n-nodes-base.aiTransform',
          position: [650, 300],
          parameters: {
            instructions: 'Group customers by region and calculate average order value',
            model: 'gpt-4'
          }
        }
      ],
      connections: {
        'Start': {
          'main': [[{ node: 'Generate Test Data', type: 'main', index: 0 }]]
        },
        'Generate Test Data': {
          'main': [[{ node: 'AI Transform', type: 'main', index: 0 }]]
        }
      }
    };
    
    const created = await manager.createWorkflow(workflow);
    workflowId = created.id;
    
    // Act - Execute with Task Runner for performance
    const execution = await manager.executeWorkflow(workflowId, {
      mode: 'task-runner'
    });
    
    // Assert - Verify results and performance
    expect(execution.finished).toBe(true);
    expect(execution.data.resultData.error).toBeUndefined();
    expect(execution.executionTime).toBeLessThan(3000);
    
    const output = execution.data.resultData.runData['AI Transform'][0].data.main[0];
    expect(output[0].json).toHaveProperty('regionSummary');
    expect(output[0].json.regionSummary).toHaveProperty('averageOrderValue');
  });
});
```

### 4. Performance Testing

**Load Test Example** (`tests/performance/load-test.ts`):
```typescript
describe('Workflow Performance', () => {
  it('should handle 1000 concurrent executions', async () => {
    const results = await manager.runLoadTest({
      workflowId,
      concurrency: 100,
      iterations: 1000,
      rampUpTime: 30
    });
    
    expect(results.successRate).toBeGreaterThan(0.99);
    expect(results.p95ResponseTime).toBeLessThan(5000);
    expect(results.throughput).toBeGreaterThan(200); // executions/second
  });
});
```

## Common Patterns and Best Practices

### 1. Modern Credential Management

**External Secrets Integration** (NEW):
```bash
# Configure external secrets provider
N8N_EXTERNAL_SECRETS_UPDATE_INTERVAL=300
N8N_EXTERNAL_SECRETS_PROVIDERS=aws,vault

# Use in workflows
{{ $secrets.aws.api-key }}
{{ $secrets.vault.database-password }}
```

**Environment-based Credentials**:
```bash
# In .env file
N8N_CREDENTIAL_api_auth_TYPE=httpBasicAuth
N8N_CREDENTIAL_api_auth_username={{ $secrets.vault.api-username }}
N8N_CREDENTIAL_api_auth_password={{ $secrets.vault.api-password }}
```

### 2. Error Handling Pattern with Subworkflows

```json
{
  "name": "Error Handler Subworkflow",
  "nodes": [
    {
      "name": "Execute Sub-workflow",
      "type": "n8n-nodes-base.executeWorkflow",
      "parameters": {
        "workflowId": "error-handler-template",
        "mode": "error_workflow"
      },
      "continueOnFail": true
    }
  ]
}
```

### 3. AI-Powered Data Validation

```javascript
// In AI Transform node
const validationPrompt = `
Validate the following data and return any issues:
- Required fields: id, email, name
- Email must be valid format
- ID must be unique
- Return {valid: boolean, errors: string[]}

Data: ${JSON.stringify($input.all())}
`;

// The AI will generate appropriate validation code
```

### 4. Workflow Naming Convention

Follow the community standard:
```
[Status] Source/Trigger > Destination: Action (Work Item ID)

Examples:
[Prod] Webhook > Salesforce: Create Lead (JIRA-123)
[InDev] Schedule > Email: Daily Report
[InTesting] Manual > AI Transform: Customer Analysis (TKT-456)
```

## Enhanced Debugging Capabilities

### 1. Execution Replay and Analysis

```typescript
// Load failed execution for debugging
const failedExecution = await manager.getExecution(executionId);
const replayResult = await manager.replayExecution(failedExecution, {
  pauseOnError: true,
  stepThrough: true
});
```

### 2. Advanced Logging Configuration

```bash
# Winston logging setup
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=console,file
N8N_LOG_FILE_LOCATION=/var/log/n8n/
N8N_LOG_FILE_MAX_SIZE=100m
N8N_LOG_FILE_MAX_FILES=30

# Execution-specific logging
N8N_LOG_EXECUTION_DATA=true
N8N_LOG_NODE_PERFORMANCE=true
```

### 3. Health Monitoring

```typescript
// Monitor workflow health
const health = await fetch('http://n8n-instance/healthz');
const metrics = await fetch('http://n8n-instance/metrics');
const readiness = await fetch('http://n8n-instance/healthz/readiness');

// Custom health checks
if (metrics.execution_queue_length > 1000) {
  console.warn('Queue backup detected');
}
```

## Workflow Optimization (2025 Standards)

### 1. Task Runner Configuration

```bash
# Enable Task Runners for 6x performance
N8N_RUNNERS_ENABLED=true
N8N_RUNNERS_MODE=external_process
N8N_RUNNERS_MAX_WORKERS=4
N8N_RUNNERS_TIMEOUT=300
N8N_RUNNERS_ALLOWED_MODULES=lodash,moment,axios
```

### 2. Queue Mode for Production

```bash
# Main instance configuration
N8N_EXECUTIONS_MODE=queue
N8N_QUEUE_BULL_REDIS_HOST=redis
N8N_QUEUE_HEALTH_CHECK_ACTIVE=true

# Worker instance configuration
N8N_EXECUTIONS_MODE=queue
N8N_QUEUE_WORKER_TIMEOUT=30
N8N_QUEUE_WORKER_MAX_JOBS_PER_WORKER=10
```

### 3. Memory Optimization Patterns

```javascript
// Process large datasets in batches
const BATCH_SIZE = 100;
const results = [];

for (let i = 0; i < $input.all().length; i += BATCH_SIZE) {
  const batch = $input.all().slice(i, i + BATCH_SIZE);
  
  // Process batch with AI Transform or Code node
  const processed = await $helpers.processInBatch(batch);
  results.push(...processed);
  
  // Allow garbage collection between batches
  if (i % 1000 === 0) {
    await $helpers.pause(100);
  }
}

return results;
```

### 4. Binary Data Optimization

```bash
# Store binary data externally
N8N_DEFAULT_BINARY_DATA_MODE=s3
N8N_BINARY_DATA_S3_BUCKET=n8n-binary-data
N8N_BINARY_DATA_TTL=7d
```

## Security Guidelines (Enterprise-Grade)

### 1. RBAC Configuration
```bash
# Enable role-based access control
N8N_USER_MANAGEMENT_ENABLED=true
N8N_USER_MANAGEMENT_ENFORCE_PERMISSIONS=true
N8N_PROJECT_BASED_PERMISSIONS=true
```

### 2. Security Scanning in Workflows
```javascript
// Automated security checks in Code nodes
const securityChecks = {
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/i,
  scriptInjection: /<script[^>]*>.*?<\/script>/gi,
  pathTraversal: /\.\.[\/\\]/g
};

const input = $input.first().json.userInput;
for (const [threat, pattern] of Object.entries(securityChecks)) {
  if (pattern.test(input)) {
    throw new Error(`Security threat detected: ${threat}`);
  }
}
```

### 3. Credential Auditing
```typescript
// Regular credential audit workflow
const unusedCredentials = await manager.auditCredentials({
  checkUnused: true,
  checkExpired: true,
  checkWeakPasswords: true
});

if (unusedCredentials.length > 0) {
  await manager.notifySecurityTeam(unusedCredentials);
}
```

## Testing Checklist (2025 Edition)

Before considering a workflow complete:

- [ ] **Data pinning** configured for all test scenarios
- [ ] **Unit tests** pass for individual node logic
- [ ] **Integration tests** pass for complete workflow
- [ ] **Performance tests** validate Task Runner optimizations
- [ ] **AI Transform nodes** have fallback logic for API failures
- [ ] **Error scenarios** are tested with Debug Helper
- [ ] **Security scans** pass (SQL injection, XSS, etc.)
- [ ] **External secrets** configured instead of hardcoded values
- [ ] **Subworkflows** tested independently
- [ ] **Memory usage** profiled for large datasets
- [ ] **Queue mode** tested for production configuration
- [ ] **Monitoring endpoints** verified
- [ ] **Documentation** includes AI prompt examples
- [ ] **Version control** includes workflow and test files
- [ ] **Load tests** confirm scalability requirements

## Quick Command Reference (Updated)

```bash
# Run tests
npm test                      # All tests
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests
npm run test:declarative     # Declarative tests
npm run test:performance     # Performance tests
npm run test:security        # Security scans

# Workflow management
npm run workflow:list        # List all workflows
npm run workflow:execute     # Execute specific workflow
npm run workflow:pin-data    # Pin current execution data
npm run workflow:export      # Export for version control

# Task Runner management
npm run runners:start        # Start Task Runners
npm run runners:status       # Check runner health
npm run runners:benchmark    # Performance comparison

# Development tools
npm run ai:generate-code     # Generate code from prompt
npm run debug:replay         # Replay failed execution
npm run monitor:health       # Check system health
npm run secrets:sync         # Sync external secrets

# Docker management (with Task Runners)
npm run docker:start         # Start n8n with runners
npm run docker:scale         # Scale worker instances
npm run docker:logs          # View aggregated logs
npm run docker:metrics       # Export Prometheus metrics
```

## Modern n8n Resources

### Official Resources
- [n8n AI Documentation](https://docs.n8n.io/advanced-ai/)
- [Task Runners Guide](https://docs.n8n.io/hosting/task-runners/)
- [External Secrets Setup](https://docs.n8n.io/external-secrets/)
- [Performance Benchmarking](https://docs.n8n.io/hosting/scaling/performance-benchmarking/)

### Community Resources
- [Awesome n8n](https://github.com/restyler/awesome-n8n) - 1,725+ community nodes
- [n8n Community Forum](https://community.n8n.io) - Testing patterns and examples
- [n8n Ambassador Network](https://n8n.io/ambassadors) - Expert guidance
- [Test Workflows Repository](https://github.com/n8n-io/test-workflows)

## Important Reminders (2025 Edition)

1. **AI-First Development** - Use AI Transform for complex logic before writing code
2. **Pin Everything** - Data pinning is essential for reliable testing
3. **Task Runners Always** - Enable for 6x performance improvement
4. **External Secrets Only** - Never hardcode credentials, use vault integrations
5. **Test at Scale** - Load test with expected production volumes
6. **Monitor Everything** - Use health endpoints and metrics
7. **Version Control Workflows** - Treat workflows as code
8. **Subworkflow Architecture** - Build modular, testable components
9. **Security by Default** - Scan inputs, audit credentials, use RBAC
10. **Community First** - Leverage 1,725+ nodes before building custom

Remember: The goal is AI-powered, enterprise-grade workflow automation with comprehensive testing and monitoring!