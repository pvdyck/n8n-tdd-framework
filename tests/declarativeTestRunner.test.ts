import { DeclarativeTestRunner } from '../src/workflows/testing/declarative/runner';
import { Credential, TestCase } from '../src/testing/types';

// Mock the WorkflowManager
jest.mock('../src/workflows/manager', () => {
  return jest.fn().mockImplementation(() => {
    return {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      createWorkflowFromTemplate: jest.fn().mockImplementation((templateName, workflowName) => {
        return Promise.resolve({
          id: `${templateName}-${workflowName}`.replace(/\s+/g, '-').toLowerCase(),
          name: workflowName,
          active: false,
          nodes: [],
          connections: {}
        });
      }),
      executeWorkflow: jest.fn().mockImplementation((id, data) => {
        if (id.includes('failing')) {
          return Promise.resolve({
            success: false,
            error: 'Execution failed'
          });
        }

        if (id.includes('transform')) {
          const inputData = data?.data || {};
          return Promise.resolve({
            success: true,
            data: {
              name: inputData.name ? inputData.name.toUpperCase() : '',
              email: inputData.email,
              age: inputData.age ? inputData.age + 1 : 0
            }
          });
        }

        return Promise.resolve({
          success: true,
          data: {
            result: 'Execution successful',
            input: data
          }
        });
      }),
      deleteWorkflow: jest.fn().mockResolvedValue(true),
      createCredential: jest.fn().mockImplementation((credential) => {
        return Promise.resolve({
          id: `credential-${credential.name}`.replace(/\s+/g, '-').toLowerCase(),
          ...credential
        });
      }),
      deleteCredential: jest.fn().mockResolvedValue(true)
    };
  });
});

// Mock the file system
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    readFileSync: jest.fn().mockImplementation((path) => {
      if (path.includes('test-file.json')) {
        return JSON.stringify([
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
                description: 'Response should be successful',
                assertion: 'result && result.success === true'
              }
            ]
          },
          {
            name: 'Test Case 2',
            workflows: [
              {
                templateName: 'failing_workflow',
                name: 'Failing Workflow',
                isPrimary: true
              }
            ],
            assertions: [
              {
                description: 'Response should be successful',
                assertion: 'result && result.success === true'
              }
            ]
          }
        ]);
      }

      if (path.includes('transform-test.json')) {
        return JSON.stringify([
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
                description: 'Name should be uppercase',
                assertion: 'result && result.data && result.data.name === "JOHN DOE"'
              },
              {
                description: 'Age should be incremented',
                assertion: 'result && result.data && result.data.age === 31'
              }
            ]
          }
        ]);
      }

      return JSON.stringify([]);
    }),
    existsSync: jest.fn().mockReturnValue(true),
    readdirSync: jest.fn().mockReturnValue(['test-file.json'])
  };
});

describe('DeclarativeTestRunner', () => {
  let runner: DeclarativeTestRunner;

  beforeEach(() => {
    runner = new DeclarativeTestRunner({
      reporter: 'none'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
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
          description: 'Response should be successful',
          assertion: 'result && result.success === true'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    expect(result.passed).toBe(true);
    expect(result.name).toBe('Simple Test');
    expect(result.assertions).toHaveLength(1);
    expect(result.assertions![0].passed).toBe(true);
  });

  test('should run tests from a file', async () => {
    const results = await runner.runTestsFromFile('test-file.json');

    expect(results.total).toBe(2);
    expect(results.passed).toBe(1);
    expect(results.failed).toBe(1);
    expect(results.results).toHaveLength(2);
    expect(results.results[0].passed).toBe(true);
    expect(results.results[1].passed).toBe(false);
  });

  test('should evaluate complex assertions', async () => {
    const results = await runner.runTestsFromFile('transform-test.json');

    expect(results.total).toBe(1);
    expect(results.passed).toBe(1);
    expect(results.results[0].assertions).toHaveLength(2);
    expect(results.results[0].assertions![0].passed).toBe(true);
    expect(results.results[0].assertions![1].passed).toBe(true);
  });

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
          templateName: 'error_workflow',
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

    // Mock the executeWorkflow to throw an error
    const mockManager = require('../src/workflows/manager').mock.results[0].value;
    mockManager.executeWorkflow.mockRejectedValueOnce(new Error('Execution error'));

    const result = await runner.runTest(testCase);

    expect(result.passed).toBe(false);
    expect(result.error).toContain('Execution error');
  });

  test('should create and use credentials', async () => {
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
          name: 'API Credential',
          type: 'httpBasicAuth',
          data: {
            username: 'testuser',
            password: 'testpass'
          }
        }
      ],
      assertions: [
        {
          description: 'Response should be successful',
          assertion: 'result && result.success === true'
        }
      ]
    };

    const result = await runner.runTest(testCase);

    // Verify the test passed
    expect(result.passed).toBe(true);

    // Verify credentials were created
    expect(result.credentials).toBeDefined();
    expect(result.credentials).toHaveLength(1);
    expect(result.credentials![0].name).toBe('API Credential');

    // Verify createCredential was called
    const mockManager = require('../src/workflows/manager').mock.results[0].value;
    expect(mockManager.createCredential).toHaveBeenCalledWith({
      name: 'API Credential',
      type: 'httpBasicAuth',
      data: {
        username: 'testuser',
        password: 'testpass'
      }
    });

    // Verify deleteCredential was called during cleanup
    expect(mockManager.deleteCredential).toHaveBeenCalled();
  });
});