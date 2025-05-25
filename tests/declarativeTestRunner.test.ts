import { DeclarativeTestRunner } from '../src/workflows/testing/declarative/runner';
import { Credential, TestCase, TestRunResult } from '../src/testing/types';
import * as fs from 'fs';
import * as path from 'path';
import WorkflowManager from '../src/workflows/manager';

// Use real environment variables for API connection
const API_KEY = process.env.N8N_API_KEY || 'n8n_api_test_key_123456789';
const API_URL = process.env.N8N_API_URL || 'http://localhost:5678/api/v1';

// Helper to create test template directory
function setupTestTemplates() {
  const templatesDir = path.join(process.cwd(), 'test-templates-runner');
  
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Create a simple HTTP request template
  const httpRequestTemplate = {
    name: 'HTTP Request Template',
    nodes: [
      {
        id: 'node1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {
          path: 'test-http',
          responseMode: 'lastNode',
          responseData: 'allEntries'
        }
      },
      {
        id: 'node2',
        name: 'Set',
        type: 'n8n-nodes-base.set',
        typeVersion: 1,
        position: [450, 300],
        parameters: {
          values: {
            string: [
              {
                name: 'status',
                value: 'success'
              }
            ]
          }
        }
      }
    ],
    connections: {
      'Webhook': {
        'main': [
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
  };
  
  // Create a transform template
  const transformTemplate = {
    name: 'Transform Template',
    nodes: [
      {
        id: 'node1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {
          path: 'test-transform',
          responseMode: 'lastNode',
          responseData: 'allEntries'
        }
      },
      {
        id: 'node2',
        name: 'Code',
        type: 'n8n-nodes-base.code',
        typeVersion: 1,
        position: [450, 300],
        parameters: {
          jsCode: `
            const inputData = $input.first().json.data || {};
            return [{
              json: {
                name: inputData.name ? inputData.name.toUpperCase() : '',
                email: inputData.email,
                age: inputData.age ? inputData.age + 1 : 0
              }
            }];
          `
        }
      }
    ],
    connections: {
      'Webhook': {
        'main': [
          [
            {
              node: 'Code',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    }
  };
  
  fs.writeFileSync(path.join(templatesDir, 'http_request.json'), JSON.stringify(httpRequestTemplate));
  fs.writeFileSync(path.join(templatesDir, 'transform.json'), JSON.stringify(transformTemplate));
  
  return templatesDir;
}

// Helper to create test files
function createTestFiles(testsDir: string) {
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }
  
  const testFile1 = [
    {
      name: 'Test Case 1',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test HTTP Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Execution should complete',
          assertion: 'result !== null && result !== undefined'
        }
      ]
    }
  ];
  
  const testFile2 = [
    {
      name: 'Transform Test',
      workflows: [
        {
          templateName: 'transform',
          name: 'Test Transform Workflow',
          isPrimary: true
        }
      ],
      input: {
        data: {
          name: 'john',
          email: 'john@example.com',
          age: 25
        }
      },
      assertions: [
        {
          type: 'property',
          description: 'Name should be uppercase',
          path: 'name',
          expected: 'JOHN'
        },
        {
          type: 'property',
          description: 'Age should be incremented',
          path: 'age',
          expected: 26
        }
      ]
    }
  ];
  
  const testWithCredentials = [
    {
      name: 'Test with credentials',
      credentials: [
        {
          name: 'test-auth',
          type: 'httpBasicAuth',
          data: {
            username: { value: 'testuser' },
            password: { value: 'testpass' }
          }
        }
      ],
      workflows: [
        {
          templateName: 'http_request',
          name: 'Workflow with credentials',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should execute successfully',
          assertion: 'result !== null'
        }
      ]
    }
  ];
  
  const invalidTest = [
    {
      name: 'Data Transform Test',
      workflows: [
        {
          templateName: 'transform',
          name: 'Transform Workflow',
          isPrimary: true
        }
      ],
      input: {
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          age: 30
        }
      },
      assertions: [
        {
          description: 'Result should exist',
          assertion: 'result !== null && result !== undefined'
        },
        {
          description: 'Result should be an object',
          assertion: 'typeof result === "object"'
        }
      ]
    }
  ];
  
  fs.writeFileSync(path.join(testsDir, 'test-file.json'), JSON.stringify(testFile1));
  fs.writeFileSync(path.join(testsDir, 'transform-test.json'), JSON.stringify(testFile2));
  fs.writeFileSync(path.join(testsDir, 'credential-test.json'), JSON.stringify(testWithCredentials));
  fs.writeFileSync(path.join(testsDir, 'invalid-test.json'), JSON.stringify(invalidTest));
}

describe('DeclarativeTestRunner', () => {
  let runner: DeclarativeTestRunner;
  let templatesDir: string;
  let testsDir: string;

  beforeAll(() => {
    // Set environment variables for testing
    process.env.N8N_API_KEY = API_KEY;
    process.env.N8N_API_URL = API_URL;
    
    // Setup test templates and files
    templatesDir = setupTestTemplates();
    testsDir = path.join(process.cwd(), 'test-tests-runner');
    createTestFiles(testsDir);
  });

  beforeEach(() => {
    runner = new DeclarativeTestRunner({
      reporter: 'none',
      templatesDir,
      testsDir,
      apiKey: API_KEY,
      apiUrl: API_URL
    });
  });

  afterAll(() => {
    // Clean up test directories
    fs.rmSync(templatesDir, { recursive: true, force: true });
    fs.rmSync(testsDir, { recursive: true, force: true });
  });

  test('should run a test case', async () => {
    const testCase: TestCase = {
      name: 'Simple Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Execution should complete',
          assertion: 'result !== null && result !== undefined'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Simple Test');
    expect(result.assertions).toHaveLength(1);
    expect(result.assertions![0].passed).toBe(true);
  }, 30000); // Increase timeout for API calls

  test('should run tests from a file', async () => {
    const results = await runner.runTestsFromFile(path.join(testsDir, 'test-file.json'));

    expect(results.total).toBe(1);
    expect(results.passed).toBe(1);
    expect(results.failed).toBe(0);
    expect(results.results).toHaveLength(1);
    expect(results.results[0].passed).toBe(true);
  }, 30000);

  test('should evaluate complex assertions', async () => {
    const results = await runner.runTestsFromFile(path.join(testsDir, 'transform-test.json'));

    expect(results.total).toBe(1);
    expect(results.passed).toBe(1);
    expect(results.results[0].assertions).toHaveLength(2);
    expect(results.results[0].assertions![0].passed).toBe(true);
    expect(results.results[0].assertions![1].passed).toBe(true);
  }, 30000);

  test('should handle validation errors', async () => {
    const invalidTestCase: TestCase = {
      name: 'Invalid Test',
      workflows: [], // Missing required workflows
      assertions: []
    };

    const result = await runner.runTest(invalidTestCase);

    expect(result.passed).toBe(false);
    expect(result.error).toContain('Validation errors');
  });

  test('should handle execution errors', async () => {
    const testCase: TestCase = {
      name: 'Error Test',
      workflows: [
        {
          templateName: 'non_existent_template',
          name: 'Error Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should not reach here',
          assertion: 'true'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.passed).toBe(false);
    expect(result.error).toBeDefined();
  }, 30000);

  test('should create and use credentials', async () => {
    // Set up environment variables for test credential
    process.env.N8N_CREDENTIAL_TESTAPI_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_TESTAPI_USERNAME = 'testuser';
    process.env.N8N_CREDENTIAL_TESTAPI_PASSWORD = 'testpass';

    const testCase: TestCase = {
      name: 'Credential Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'API Workflow',
          isPrimary: true
        }
      ],
      credentials: [
        {
          name: 'TESTAPI'
        }
      ],
      assertions: [
        {
          description: 'Execution should complete',
          assertion: 'result !== null && result !== undefined'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    // Verify the test passed
    expect(result.passed).toBe(true);

    // Verify credentials were created
    expect(result.credentials).toBeDefined();
    expect(result.credentials).toHaveLength(1);
    expect(result.credentials![0].name).toBe('TESTAPI');

    // Clean up environment variables
    delete process.env.N8N_CREDENTIAL_TESTAPI_TYPE;
    delete process.env.N8N_CREDENTIAL_TESTAPI_USERNAME;
    delete process.env.N8N_CREDENTIAL_TESTAPI_PASSWORD;
  }, 30000);

  test('should run all tests from directory', async () => {
    const results = await runner.runTestsFromDirectory(testsDir);

    expect(results.total).toBeGreaterThanOrEqual(4);
    expect(results.results.length).toBeGreaterThanOrEqual(4);
    expect(results.duration).toBeGreaterThan(0);
  }, 60000);

  test('should use console reporter', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const consoleRunner = new DeclarativeTestRunner({
      reporter: 'console',
      templatesDir,
      testsDir,
      apiKey: API_KEY,
      apiUrl: API_URL
    });

    const testCase: TestCase = {
      name: 'Console Reporter Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should pass',
          assertion: 'true'
        }
      ]
    };

    await consoleRunner.runTest(testCase);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ PASS'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Console Reporter Test'));

    consoleSpy.mockRestore();
  }, 30000);

  test('should use JSON reporter', async () => {
    const reportPath = path.join(testsDir, 'test-report.json');
    
    const jsonRunner = new DeclarativeTestRunner({
      reporter: 'json',
      reportPath,
      templatesDir,
      testsDir,
      apiKey: API_KEY,
      apiUrl: API_URL
    });

    const testCase: TestCase = {
      name: 'JSON Reporter Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should pass',
          assertion: 'true'
        }
      ]
    };

    const result = await jsonRunner.runTest(testCase);
    
    // Run summary to trigger JSON report
    const runResult = await jsonRunner.runTestsFromDirectory(testsDir);

    expect(fs.existsSync(reportPath)).toBe(true);
    
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    expect(report.total).toBeDefined();
    expect(report.passed).toBeDefined();
    expect(report.failed).toBeDefined();
    
    // Clean up
    fs.unlinkSync(reportPath);
  }, 30000);

  test('should handle test with custom input data', async () => {
    const testCase: TestCase = {
      name: 'Custom Input Test',
      workflows: [
        {
          templateName: 'transform',
          name: 'Transform Workflow',
          isPrimary: true
        }
      ],
      input: {
        custom: 'data',
        nested: {
          value: 123
        }
      },
      assertions: [
        {
          description: 'Should have result',
          assertion: 'result !== null'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.passed).toBe(true);
  }, 30000);

  test('should handle multiple workflows in a test', async () => {
    const testCase: TestCase = {
      name: 'Multi-Workflow Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Workflow 1',
          isPrimary: true
        },
        {
          templateName: 'transform',
          name: 'Workflow 2',
          isPrimary: false
        }
      ],
      assertions: [
        {
          description: 'Primary workflow should execute',
          assertion: 'result !== null'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.workflows).toHaveLength(2);
    expect(result.workflows![0].name).toBe('Workflow 1');
    expect(result.workflows![1].name).toBe('Workflow 2');
  }, 30000);

  test('should handle property assertions', async () => {
    const testCase: TestCase = {
      name: 'Property Assertion Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should have status property',
          assertion: 'result.status === "success"'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.assertions).toHaveLength(1);
  }, 30000);

  test('should handle regex assertions', async () => {
    const testCase: TestCase = {
      name: 'Regex Assertion Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should match pattern',
          assertion: 'result.status && result.status.match(/succ.*/)'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.assertions).toHaveLength(1);
  }, 30000);

  test('should handle schema assertions', async () => {
    const testCase: TestCase = {
      name: 'Schema Assertion Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Test Workflow',
          isPrimary: true
        }
      ],
      assertions: [
        {
          description: 'Should match schema',
          assertion: 'typeof result === "object" && typeof result.status === "string"'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.assertions).toHaveLength(1);
  }, 30000);

  test('should filter tests by pattern', async () => {
    const results = await runner.runTestsFromDirectory(testsDir);

    // Should run all tests in directory
    expect(results.total).toBeGreaterThanOrEqual(1);
    // Check if transform test is included
    const transformTest = results.results.find(r => r.name === 'Transform Test');
    expect(transformTest).toBeDefined();
  }, 30000);

  test('should handle test with existing credentials', async () => {
    // Set up environment variables for the credential
    process.env.N8N_CREDENTIAL_test_existing_cred_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_test_existing_cred_username = 'existinguser';
    process.env.N8N_CREDENTIAL_test_existing_cred_password = 'existingpass';
    
    const testCase: TestCase = {
      name: 'Existing Credential Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'API Workflow',
          isPrimary: true
        }
      ],
      credentials: [
        {
          name: 'test_existing_cred'
        }
      ],
      assertions: [
        {
          description: 'Should execute',
          assertion: 'result !== null'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.passed).toBe(true);
    expect(result.credentials).toHaveLength(1);
    
    // Clean up environment variables
    delete process.env.N8N_CREDENTIAL_test_existing_cred_TYPE;
    delete process.env.N8N_CREDENTIAL_test_existing_cred_username;
    delete process.env.N8N_CREDENTIAL_test_existing_cred_password;
  }, 30000);

  test('should handle workflow execution failure gracefully', async () => {
    // Create a workflow that will fail during execution
    const testCase: TestCase = {
      name: 'Execution Failure Test',
      workflows: [
        {
          templateName: 'http_request',
          name: 'Failing Workflow',
          isPrimary: true,
          settings: {
            errorWorkflow: false // Don't handle errors
          }
        }
      ],
      input: {}, // Empty input
      assertions: [
        {
          description: 'Should still evaluate',
          assertion: 'true' // This should pass even if execution fails
        }
      ]
    };

    const result = await runner.runTest(testCase);

    // The test framework should handle the failure gracefully
    expect(result.name).toBe('Execution Failure Test');
  }, 30000);

  test('should generate proper run summary', async () => {
    const results = await runner.runTestsFromDirectory(testsDir);

    expect(results).toHaveProperty('total');
    expect(results).toHaveProperty('passed');
    expect(results).toHaveProperty('failed');
    expect(results).toHaveProperty('skipped');
    expect(results).toHaveProperty('duration');
    expect(results).toHaveProperty('results');
    expect(results).toHaveProperty('failures');
    
    if (results.failed > 0) {
      expect(results.failures.length).toBe(results.failed);
      results.failures.forEach(failure => {
        expect(failure).toHaveProperty('testName');
        expect(failure).toHaveProperty('message');
      });
    }
  }, 60000);
});