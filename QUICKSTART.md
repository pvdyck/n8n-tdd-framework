# Quick Start Guide - n8n TDD Framework

> 📚 **User Documentation** | [Framework Overview](./README.md) | [Full Documentation](./docs/README.md) | [Examples](./examples/)

Get up and running with n8n workflow testing in 5 minutes!

## 🚀 Create Your First Test Project

```bash
npx create-n8n-test-project my-n8n-tests
cd my-n8n-tests
```

## 🔧 Initial Setup

### 1. Copy and Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your n8n API key:
```env
N8N_API_KEY=your-actual-api-key-here
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start n8n Container

```bash
npm run docker:start
```

Wait ~30 seconds for n8n to start, then verify:
```bash
npm run docker:status
```

## ✅ Run Example Tests

The project comes with example workflows and tests:

```bash
# Run unit tests
npm test

# Run integration tests (requires n8n running)
npm run test:integration

# Run declarative tests
npm run test:declarative
```

## 📝 Write Your First Test

### Option 1: Declarative Test (JSON)

Create `tests/declarative/my-test.json`:

```json
{
  "name": "My First Test",
  "workflow": {
    "path": "workflows/examples/http-request.json"
  },
  "assertions": [
    {
      "type": "execution",
      "expected": {
        "finished": true
      }
    }
  ]
}
```

### Option 2: Unit Test (TypeScript)

Create `tests/unit/my-test.test.ts`:

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';

describe('My Workflow Test', () => {
  let manager: WorkflowManager;
  
  beforeAll(async () => {
    manager = new WorkflowManager();
    await manager.connect();
  });
  
  afterAll(async () => {
    await manager.disconnect();
  });
  
  it('should execute successfully', async () => {
    const workflowId = 'your-workflow-id';
    const execution = await manager.executeWorkflow(workflowId);
    
    expect(execution.finished).toBe(true);
  });
});
```

## 🎯 Next Steps

1. **Explore Examples**: Check out `workflows/examples/` for sample workflows
2. **Read Documentation**: See `docs/getting-started.md` for detailed guide
3. **Add Credentials**: Configure test credentials in `.env` file
4. **Create Workflows**: Add your workflows to `workflows/` directory
5. **Write Tests**: Add tests to `tests/unit/` or `tests/declarative/`

## 🛠️ Useful Commands

```bash
# Workflow Management
npm run workflow:list          # List all workflows
npm run workflow:create        # Create new workflow
npm run workflow:execute <id>  # Execute a workflow

# Docker Management
npm run docker:start          # Start n8n container
npm run docker:stop           # Stop n8n container
npm run docker:status         # Check container status

# Testing
npm test                      # Run unit tests
npm run test:watch           # Run tests in watch mode
npm run test:coverage        # Generate coverage report
npm run test:integration     # Run integration tests
npm run test:declarative     # Run declarative tests
```

## 🐛 Troubleshooting

### Container won't start
```bash
docker ps                    # Check if Docker is running
npm run docker:status       # Check n8n status
docker logs my-n8n-tests-n8n  # View container logs
```

### Connection errors
- Verify API key in `.env`
- Check n8n is running: `npm run docker:status`
- Ensure port 5678 is not in use: `lsof -i :5678`

### Need help?
- Check the [Documentation](https://github.com/pvdyck/n8n-tdd-framework)
- See examples in your project's `workflows/examples/`
- Review test examples in `tests/`

---

Happy testing! 🎉