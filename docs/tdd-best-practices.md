# TDD Best Practices for n8n Workflows

## Core Principles

### 1. Test First, Code Second
Always write your test before implementing the workflow. This ensures you're building exactly what's needed.

**Bad Practice:**
```javascript
// Building workflow first, then trying to test it
const workflow = createComplexWorkflow();
// Now trying to figure out what to test...
```

**Good Practice:**
```json
// Define expected behavior first
{
  "name": "Process payment and send receipt",
  "assertions": [{
    "assertion": "result.paymentId !== undefined",
    "assertion": "result.receiptSent === true"
  }]
}
// Now build workflow to satisfy these requirements
```

### 2. One Test, One Concern
Each test should verify a single behavior. This makes failures easy to diagnose.

**Bad Practice:**
```json
{
  "name": "Test everything",
  "assertions": [
    { "assertion": "result.user.created" },
    { "assertion": "result.email.sent" },
    { "assertion": "result.database.updated" },
    { "assertion": "result.cache.cleared" },
    { "assertion": "result.metrics.logged" }
  ]
}
```

**Good Practice:**
```json
// Separate tests for separate concerns
{
  "name": "Should create user in database",
  "assertions": [{ "assertion": "result.userId !== undefined" }]
},
{
  "name": "Should send welcome email",
  "assertions": [{ "assertion": "result.emailSent === true" }]
}
```

### 3. Test Behavior, Not Implementation

**Bad Practice:**
```json
{
  "name": "Check specific node output",
  "assertions": [{
    "assertion": "result.$node['Set3'].json.data[0].transformed === true"
  }]
}
```

**Good Practice:**
```json
{
  "name": "Should transform customer data",
  "assertions": [{
    "assertion": "result.customer.fullName === 'John Doe'",
    "assertion": "result.customer.tier === 'premium'"
  }]
}
```

## Test Organization

### Directory Structure
```
project/
├── tests/
│   ├── unit/           # Single node/function tests
│   ├── integration/    # Multi-node workflow tests  
│   ├── e2e/           # End-to-end scenario tests
│   └── performance/    # Load and speed tests
├── templates/          # Workflow templates
└── fixtures/          # Test data and mocks
```

### Naming Conventions

**Test Files:**
- `01-user-creation.json` - Numbered for execution order
- `user-creation.test.json` - Feature-based naming
- `critical-user-creation.json` - Priority indication

**Test Names:**
```json
// Clear, specific test names
{
  "name": "Should retry failed API calls up to 3 times",
  "name": "Should validate email format before sending",
  "name": "Should handle empty product list gracefully"
}
```

## Writing Effective Tests

### 1. Arrange-Act-Assert Pattern

```json
{
  "name": "Calculate order total with tax",
  // Arrange - Set up test data
  "input": {
    "items": [
      { "price": 100, "quantity": 2 },
      { "price": 50, "quantity": 1 }
    ],
    "taxRate": 0.08
  },
  // Act - Execute workflow (implicit)
  // Assert - Verify results
  "assertions": [{
    "description": "Should calculate correct total",
    "assertion": "result.total === 270"  // (200 + 50) * 1.08
  }]
}
```

### 2. Edge Case Testing

Always test boundaries and edge cases:

```json
[
  {
    "name": "Handle empty order list",
    "input": { "items": [] },
    "assertions": [{ "assertion": "result.total === 0" }]
  },
  {
    "name": "Handle negative quantities",
    "input": { "items": [{ "price": 100, "quantity": -1 }] },
    "assertions": [{ "assertion": "result.error === 'Invalid quantity'" }]
  },
  {
    "name": "Handle missing price",
    "input": { "items": [{ "quantity": 1 }] },
    "assertions": [{ "assertion": "result.error === 'Price required'" }]
  }
]
```

### 3. Mock External Dependencies

```json
{
  "name": "Handle API rate limiting",
  "mockResponses": {
    "HTTP Request": {
      "status": 429,
      "headers": { "retry-after": "60" },
      "body": { "error": "Rate limit exceeded" }
    }
  },
  "assertions": [{
    "description": "Should queue for retry",
    "assertion": "result.status === 'queued'",
    "assertion": "result.retryAfter === 60"
  }]
}
```

## Performance Testing

### 1. Set Performance Budgets

```json
{
  "name": "Process large dataset efficiently",
  "input": {
    "records": "[...1000 items...]"
  },
  "configuration": {
    "timeout": 30000  // 30 second budget
  },
  "assertions": [{
    "assertion": "executionTime < 25000",  // Leave buffer
    "assertion": "memoryUsage < 512"       // MB
  }]
}
```

### 2. Test Concurrent Execution

```json
{
  "name": "Handle concurrent webhook calls",
  "configuration": {
    "parallel": 50,
    "rampUp": 5000  // 5 seconds
  },
  "assertions": [{
    "assertion": "successRate > 0.99",
    "assertion": "averageResponseTime < 1000"
  }]
}
```

## Common Anti-Patterns to Avoid

### 1. Testing n8n Itself
Don't test that n8n nodes work - test your workflow logic.

**Bad:**
```json
{
  "name": "HTTP node makes request",
  "assertions": [{ "assertion": "httpRequestMade === true" }]
}
```

### 2. Brittle Tests
Avoid tests that break with minor changes.

**Bad:**
```json
{
  "assertions": [{
    "assertion": "result.timestamp === '2024-01-15T10:30:00Z'"
  }]
}
```

**Good:**
```json
{
  "assertions": [{
    "assertion": "result.timestamp !== undefined",
    "assertion": "new Date(result.timestamp).getTime() > Date.now() - 60000"
  }]
}
```

### 3. Test Interdependence
Tests should not depend on each other.

**Bad:**
```json
// test-2.json
{
  "name": "Update user created in test-1",
  "input": { "userId": "{{fromPreviousTest}}" }  // Don't do this
}
```

## Debugging Failed Tests

### 1. Use Descriptive Assertions

```json
{
  "assertions": [{
    "description": "Customer tier should be 'gold' for orders over $1000",
    "assertion": "result.customerTier === 'gold'"
  }]
}
```

### 2. Add Debug Output

```typescript
const runner = new DeclarativeTestRunner({
  debug: true,  // Enable verbose logging
  captureNodeOutput: true  // Save intermediate results
});
```

### 3. Isolate Failures

```bash
# Run single test for debugging
n8n-tdd test tests/failing-test.json --verbose
```

## Continuous Improvement

### 1. Track Metrics
- Test execution time
- Test coverage percentage
- Defect escape rate
- Time to fix failures

### 2. Regular Test Review
- Remove redundant tests
- Update tests for new requirements
- Refactor complex tests
- Add missing edge cases

### 3. Team Practices
- Code review includes test review
- Pair programming on complex tests
- Share test patterns and utilities
- Document testing decisions

## Checklist for Good TDD

Before committing, ensure:
- [ ] Test written before implementation
- [ ] All tests pass
- [ ] Tests are independent
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Performance considered
- [ ] Tests are maintainable
- [ ] Names are descriptive
- [ ] No test duplication
- [ ] Documentation updated

Following these practices ensures your n8n workflows are reliable, maintainable, and truly test-driven.