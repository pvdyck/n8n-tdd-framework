# TDD Step-by-Step: Building an n8n Workflow

This tutorial walks through building a real n8n workflow using Test-Driven Development from start to finish.

## Scenario: Customer Order Notification System

We need to build a workflow that:
1. Receives order data via webhook
2. Validates the order
3. Enriches with customer information
4. Sends notifications based on order value
5. Logs the transaction

## Step 1: Set Up Your Environment

```bash
# Install the framework
npm install n8n-tdd-framework

# Create project structure
mkdir order-notification-workflow
cd order-notification-workflow
mkdir tests templates

# Initialize configuration
cat > n8n-tdd-config.json << EOF
{
  "apiUrl": "http://localhost:5678/api/v1",
  "apiKey": "your-api-key",
  "templatesDir": "./templates",
  "testsDir": "./tests"
}
EOF
```

## Step 2: Write Your First Test (Red Phase)

Start with the simplest requirement: receiving order data.

```json
// tests/01-receive-order.json
[
  {
    "name": "Should receive and acknowledge order",
    "workflows": [{
      "templateName": "order_notification",
      "name": "Order Notification Workflow",
      "isPrimary": true
    }],
    "input": {
      "orderId": "ORD-123",
      "customerEmail": "customer@example.com",
      "amount": 99.99,
      "items": [
        { "sku": "ITEM-1", "quantity": 2, "price": 49.99 }
      ]
    },
    "assertions": [
      {
        "description": "Should return success acknowledgment",
        "assertion": "result.status === 'received'"
      },
      {
        "description": "Should echo order ID",
        "assertion": "result.orderId === 'ORD-123'"
      }
    ]
  }
]
```

Run the test (it will fail):
```bash
n8n-tdd test tests/01-receive-order.json
# ❌ Test fails - workflow doesn't exist yet
```

## Step 3: Create Minimal Workflow (Green Phase)

Create the simplest workflow that makes the test pass:

```json
// templates/order_notification.json
{
  "name": "Order Notification Workflow",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "order",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "status",
              "value": "received"
            },
            {
              "name": "orderId",
              "value": "={{ $json.orderId }}"
            }
          ]
        }
      },
      "name": "Prepare Response",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [[{ "node": "Prepare Response", "type": "main", "index": 0 }]]
    }
  }
}
```

Run the test again:
```bash
n8n-tdd test tests/01-receive-order.json
# ✅ Test passes!
```

## Step 4: Add Validation Test (Red Phase)

Now test order validation:

```json
// tests/02-validate-order.json
[
  {
    "name": "Should reject invalid order - missing customer email",
    "workflows": [{
      "templateName": "order_notification",
      "name": "Order Notification Workflow",
      "isPrimary": true
    }],
    "input": {
      "orderId": "ORD-124",
      "amount": 99.99
    },
    "assertions": [
      {
        "description": "Should return validation error",
        "assertion": "result.status === 'error'"
      },
      {
        "description": "Should specify missing field",
        "assertion": "result.error.includes('customerEmail')"
      }
    ]
  },
  {
    "name": "Should reject negative amounts",
    "workflows": [{
      "templateName": "order_notification",
      "name": "Order Notification Workflow",
      "isPrimary": true
    }],
    "input": {
      "orderId": "ORD-125",
      "customerEmail": "test@example.com",
      "amount": -50
    },
    "assertions": [
      {
        "description": "Should return validation error",
        "assertion": "result.status === 'error'"
      },
      {
        "description": "Should specify invalid amount",
        "assertion": "result.error.includes('amount')"
      }
    ]
  }
]
```

## Step 5: Implement Validation (Green Phase)

Update the workflow to include validation:

```json
// Add validation nodes to templates/order_notification.json
{
  "nodes": [
    // ... existing webhook node ...
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{ $json.customerEmail }}",
              "operation": "isNotEmpty"
            },
            {
              "value1": "={{ $json.orderId }}",
              "operation": "isNotEmpty"
            },
            {
              "value1": "={{ $json.amount }}",
              "operation": "isNotEmpty"
            },
            {
              "value1": "={{ $json.amount }}",
              "value2": 0,
              "operation": "larger"
            }
          ]
        }
      },
      "name": "Validate Order",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "status",
              "value": "error"
            },
            {
              "name": "error",
              "value": "Validation failed: {{ !$json.customerEmail ? 'customerEmail required' : '' }}{{ !$json.orderId ? 'orderId required' : '' }}{{ $json.amount <= 0 ? 'amount must be positive' : '' }}"
            }
          ]
        }
      },
      "name": "Validation Error",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [650, 400]
    }
  ]
}
```

## Step 6: Test Customer Enrichment (Red Phase)

```json
// tests/03-enrich-customer.json
[
  {
    "name": "Should enrich order with customer data",
    "workflows": [{
      "templateName": "order_notification",
      "name": "Order Notification Workflow",
      "isPrimary": true
    }],
    "credentials": [{
      "name": "CRM_API",
      "usedByWorkflow": "Order Notification Workflow",
      "usedByNode": "Get Customer"
    }],
    "input": {
      "orderId": "ORD-126",
      "customerEmail": "vip@example.com",
      "amount": 499.99
    },
    "mockResponses": {
      "Get Customer": {
        "customerName": "John VIP",
        "customerTier": "gold",
        "totalOrders": 25
      }
    },
    "assertions": [
      {
        "description": "Should include customer name",
        "assertion": "result.customerName === 'John VIP'"
      },
      {
        "description": "Should include customer tier",
        "assertion": "result.customerTier === 'gold'"
      }
    ]
  }
]
```

## Step 7: Add Customer Enrichment (Green Phase)

Add HTTP request node to fetch customer data:

```json
{
  "parameters": {
    "url": "https://api.crm.com/customers",
    "method": "GET",
    "queryParameters": {
      "parameters": [
        {
          "name": "email",
          "value": "={{ $json.customerEmail }}"
        }
      ]
    },
    "authentication": "genericCredentialType",
    "genericAuthType": "httpBasicAuth"
  },
  "name": "Get Customer",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 1,
  "position": [850, 300],
  "credentials": {
    "httpBasicAuth": "CRM_API"
  }
}
```

## Step 8: Test Notification Logic (Red Phase)

```json
// tests/04-notification-routing.json
[
  {
    "name": "Should send high-value notification for orders over $500",
    "input": {
      "orderId": "ORD-127",
      "customerEmail": "big-spender@example.com",
      "amount": 750.00
    },
    "assertions": [
      {
        "description": "Should route to high-value handler",
        "assertion": "result.notificationType === 'high-value'"
      },
      {
        "description": "Should include priority flag",
        "assertion": "result.priority === true"
      }
    ]
  },
  {
    "name": "Should send standard notification for regular orders",
    "input": {
      "orderId": "ORD-128",
      "customerEmail": "regular@example.com",
      "amount": 99.99
    },
    "assertions": [
      {
        "description": "Should route to standard handler",
        "assertion": "result.notificationType === 'standard'"
      }
    ]
  }
]
```

## Step 9: Implement Notification Routing (Green Phase)

Add conditional routing based on order value:

```json
{
  "parameters": {
    "conditions": {
      "number": [
        {
          "value1": "={{ $json.amount }}",
          "operation": "largerEqual",
          "value2": 500
        }
      ]
    }
  },
  "name": "Check Order Value",
  "type": "n8n-nodes-base.if",
  "typeVersion": 1,
  "position": [1050, 300]
}
```

## Step 10: Refactor and Optimize (Refactor Phase)

Now that all tests pass, refactor the workflow:

1. **Add error handling** for API failures
2. **Implement retry logic** for notifications
3. **Add logging** for audit trail
4. **Optimize node order** for performance

```javascript
// Run all tests to ensure nothing broke
const runner = new DeclarativeTestRunner({
  templatesDir: './templates',
  testsDir: './tests'
});

const results = await runner.runTestsFromDirectory('./tests');
console.log(`All tests: ${results.passed}/${results.total} passed`);
```

## Step 11: Add Integration Tests

Create comprehensive tests that cover the entire workflow:

```json
// tests/05-full-integration.json
[
  {
    "name": "Complete order processing flow",
    "workflows": [{
      "templateName": "order_notification",
      "name": "Order Notification Workflow",
      "isPrimary": true
    }],
    "credentials": [
      { "name": "CRM_API" },
      { "name": "EMAIL_SMTP" },
      { "name": "SLACK_WEBHOOK" }
    ],
    "input": {
      "orderId": "ORD-129",
      "customerEmail": "integration@example.com",
      "amount": 999.99,
      "items": [
        { "sku": "PREMIUM-1", "quantity": 1, "price": 999.99 }
      ]
    },
    "assertions": [
      {
        "description": "Should complete successfully",
        "assertion": "result.status === 'completed'"
      },
      {
        "description": "Should send all notifications",
        "assertion": "result.notifications.email === true && result.notifications.slack === true"
      },
      {
        "description": "Should log transaction",
        "assertion": "result.transactionId !== undefined"
      }
    ]
  }
]
```

## Step 12: Performance Testing

Add tests for performance requirements:

```json
// tests/06-performance.json
[
  {
    "name": "Should handle high volume",
    "configuration": {
      "parallel": 10,
      "timeout": 5000
    },
    "assertions": [
      {
        "description": "Should process within 5 seconds",
        "assertion": "executionTime < 5000"
      },
      {
        "description": "Should maintain success rate",
        "assertion": "successRate > 0.99"
      }
    ]
  }
]
```

## Running Your TDD Workflow

```typescript
// index.ts - Automated test runner
import { WorkflowManager, DeclarativeTestRunner } from 'n8n-tdd-framework';

async function developWithTDD() {
  const manager = new WorkflowManager();
  const runner = new DeclarativeTestRunner({
    templatesDir: './templates',
    testsDir: './tests'
  });

  // Watch for changes and run tests
  console.log('Starting TDD development mode...');
  
  // Run tests on file change
  const watcher = chokidar.watch(['./templates', './tests']);
  
  watcher.on('change', async (path) => {
    console.log(`File changed: ${path}`);
    const results = await runner.runTestsFromDirectory();
    
    if (results.failed > 0) {
      console.log('❌ Tests failing - keep coding!');
    } else {
      console.log('✅ All tests passing - ready to refactor!');
    }
  });
}

developWithTDD();
```

## Key Takeaways

1. **Start Simple** - First test should be the most basic functionality
2. **One Feature at a Time** - Don't try to test everything at once
3. **Test Behavior, Not Implementation** - Focus on what, not how
4. **Refactor When Green** - Only refactor when all tests pass
5. **Keep Tests Fast** - Quick feedback loop is essential
6. **Document Through Tests** - Tests serve as living documentation

## Next Steps

- Add more edge cases
- Test error scenarios
- Implement monitoring tests
- Create performance benchmarks
- Build a test suite for production workflows

Remember: TDD is about building confidence in your workflows through comprehensive testing. Each test you write is an investment in the reliability and maintainability of your n8n automations.