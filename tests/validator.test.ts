import { DeclarativeTestValidator } from '../src/workflows/testing/declarative/validator';
import { TestCase, Assertion } from '../src/testing/types';

describe('DeclarativeTestValidator', () => {
  let validator: DeclarativeTestValidator;

  beforeEach(() => {
    validator = new DeclarativeTestValidator();
  });

  describe('validateTestCase', () => {
    test('should validate valid test case', () => {
      const testCase: TestCase = {
        name: 'Valid Test',
        workflows: [
          {
            templateName: 'test_template',
            name: 'Test Workflow',
            isPrimary: true
          }
        ],
        assertions: [
          {
            description: 'Should pass',
            assertion: 'result !== null'
          }
        ]
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should invalidate test case without name', () => {
      const testCase = {
        workflows: [],
        assertions: []
      } as any;

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('name'))).toBe(true);
    });

    test('should invalidate test case without workflows', () => {
      const testCase = {
        name: 'Test',
        assertions: []
      } as any;

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('workflows'))).toBe(true);
    });

    test('should invalidate test case with empty workflows array', () => {
      const testCase: TestCase = {
        name: 'Test',
        workflows: [],
        assertions: []
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('at least one workflow'))).toBe(true);
    });

    test('should invalidate test case without primary workflow', () => {
      const testCase: TestCase = {
        name: 'Test',
        workflows: [
          {
            templateName: 'template1',
            name: 'Workflow 1',
            isPrimary: false
          },
          {
            templateName: 'template2',
            name: 'Workflow 2',
            isPrimary: false
          }
        ],
        assertions: []
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('marked as primary'))).toBe(true);
    });

    test('should invalidate test case with multiple primary workflows', () => {
      const testCase: TestCase = {
        name: 'Test',
        workflows: [
          {
            templateName: 'template1',
            name: 'Workflow 1',
            isPrimary: true
          },
          {
            templateName: 'template2',
            name: 'Workflow 2',
            isPrimary: true
          }
        ],
        assertions: []
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Only one workflow'))).toBe(true);
    });

    test('should validate test case with description', () => {
      const testCase: TestCase = {
        name: 'Test',
        description: 'Test description',
        workflows: [
          {
            templateName: 'template',
            name: 'Workflow',
            isPrimary: true
          }
        ],
        assertions: []
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(true);
    });

    test('should validate test case with input data', () => {
      const testCase: TestCase = {
        name: 'Test',
        workflows: [
          {
            templateName: 'template',
            name: 'Workflow',
            isPrimary: true
          }
        ],
        input: {
          data: 'test'
        },
        assertions: []
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(true);
    });

    test('should validate test case with credentials', () => {
      const testCase: TestCase = {
        name: 'Test',
        workflows: [
          {
            templateName: 'template',
            name: 'Workflow',
            isPrimary: true
          }
        ],
        credentials: [
          {
            name: 'test-cred',
            type: 'httpBasicAuth',
            data: {
              username: { value: 'user' },
              password: { value: 'pass' }
            }
          }
        ],
        assertions: []
      };

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAssertion', () => {
    test('should validate expression assertion', () => {
      const assertion: Assertion = {
        description: 'Test assertion',
        assertion: 'result.status === 200'
      };

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(true);
    });

    test('should validate property assertion', () => {
      const assertion: Assertion = {
        type: 'property',
        description: 'Test property',
        path: 'data.name',
        expected: 'John'
      };

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(true);
    });

    test('should invalidate property assertion without path', () => {
      const assertion: Assertion = {
        type: 'property',
        description: 'Test property',
        expected: 'John'
      } as any;

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('path'))).toBe(true);
    });

    test('should invalidate property assertion without expected value', () => {
      const assertion: Assertion = {
        type: 'property',
        description: 'Test property',
        path: 'data.name'
      } as any;

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('expected'))).toBe(true);
    });

    test('should validate regex assertion', () => {
      const assertion: Assertion = {
        type: 'regex',
        description: 'Test regex',
        path: 'data.email',
        pattern: '^[\\w-\\.]+@[\\w-]+\\.[a-z]{2,}$'
      };

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(true);
    });

    test('should invalidate regex assertion without pattern', () => {
      const assertion: Assertion = {
        type: 'regex',
        description: 'Test regex',
        path: 'data.email'
      } as any;

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('pattern'))).toBe(true);
    });

    test('should validate schema assertion', () => {
      const assertion: Assertion = {
        type: 'schema',
        description: 'Test schema',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          }
        }
      };

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(true);
    });

    test('should invalidate schema assertion without schema', () => {
      const assertion: Assertion = {
        type: 'schema',
        description: 'Test schema'
      } as any;

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('schema'))).toBe(true);
    });

    test('should invalidate assertion without description', () => {
      const assertion = {
        assertion: 'result !== null'
      } as any;

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('description'))).toBe(true);
    });

    test('should invalidate expression assertion without assertion', () => {
      const assertion = {
        description: 'Test'
      } as any;

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('assertion'))).toBe(true);
    });

    test('should invalidate unknown assertion type', () => {
      const assertion: Assertion = {
        type: 'unknown' as any,
        description: 'Test'
      };

      const result = (validator as any)._validateAssertion(assertion);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Unknown assertion type'))).toBe(true);
    });
  });

  describe('validateWorkflow', () => {
    test('should validate workflow with template', () => {
      const workflow = {
        templateName: 'test_template',
        name: 'Test Workflow',
        isPrimary: true
      };

      const result = (validator as any).validateWorkflow(workflow);
      expect(result.valid).toBe(true);
    });

    test('should validate workflow with inline definition', () => {
      const workflow = {
        name: 'Test Workflow',
        isPrimary: true,
        nodes: [],
        connections: {}
      };

      const result = (validator as any).validateWorkflow(workflow);
      expect(result.valid).toBe(true);
    });

    test('should invalidate workflow without name', () => {
      const workflow = {
        templateName: 'test_template',
        isPrimary: true
      } as any;

      const result = (validator as any).validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('name'))).toBe(true);
    });

    test('should invalidate workflow without template or inline definition', () => {
      const workflow = {
        name: 'Test Workflow',
        isPrimary: true
      };

      const result = (validator as any).validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('templateName or inline'))).toBe(true);
    });

    test('should validate workflow with settings', () => {
      const workflow = {
        templateName: 'test_template',
        name: 'Test Workflow',
        isPrimary: true,
        settings: {
          saveDataSuccessExecution: 'all'
        }
      };

      const result = (validator as any).validateWorkflow(workflow);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCredential', () => {
    test('should validate credential with name reference', () => {
      const credential = {
        name: 'ENV_CREDENTIAL'
      };

      const result = (validator as any).validateCredential(credential);
      expect(result.valid).toBe(true);
    });

    test('should validate credential with full definition', () => {
      const credential = {
        name: 'test-cred',
        type: 'httpBasicAuth',
        data: {
          username: { value: 'user' },
          password: { value: 'pass' }
        }
      };

      const result = (validator as any).validateCredential(credential);
      expect(result.valid).toBe(true);
    });

    test('should invalidate credential without name', () => {
      const credential = {
        type: 'httpBasicAuth',
        data: {}
      } as any;

      const result = (validator as any).validateCredential(credential);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('name'))).toBe(true);
    });

    test('should invalidate credential with data but no type', () => {
      const credential = {
        name: 'test-cred',
        data: {
          username: 'user'
        }
      } as any;

      const result = (validator as any).validateCredential(credential);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('type'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle null test case', () => {
      const result = (validator as any)._validateTestCase(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle undefined test case', () => {
      const result = (validator as any)._validateTestCase(undefined as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle malformed test case', () => {
      const result = (validator as any)._validateTestCase('not a test case' as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should accumulate multiple errors', () => {
      const testCase = {
        // Missing name
        workflows: [
          {
            // Missing name
            isPrimary: true
          }
        ],
        assertions: [
          {
            // Missing description
            assertion: 'true'
          }
        ]
      } as any;

      const result = (validator as any)._validateTestCase(testCase);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });
});