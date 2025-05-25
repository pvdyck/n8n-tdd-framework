import { DeclarativeTestCreator } from '../src/workflows/testing/declarative/testCreator';
import { TestCase, Workflow } from '../src/testing/types';
import * as fs from 'fs';
import * as path from 'path';

describe('DeclarativeTestCreator', () => {
  let creator: DeclarativeTestCreator;

  beforeEach(() => {
    creator = new DeclarativeTestCreator();
  });

  describe('createTestCase', () => {
    test('should create basic test case', () => {
      const test = creator.createTestCase('Test Name', 'workflow-id');

      expect(test.name).toBe('Test Name');
      expect(test.workflows).toHaveLength(1);
      expect(test.workflows[0].name).toBe('Test Name Workflow');
      expect(test.workflows[0].isPrimary).toBe(true);
      expect(test.assertions).toHaveLength(1);
      expect(test.assertions[0].description).toBe('Default assertion');
    });

    test('should create test case with options', () => {
      const test = creator.createTestCase('Test Name', 'workflow-id', {
        input: { data: 'test' },
        expectedOutput: { result: 'success' },
        assertions: [
          {
            description: 'Custom assertion',
            assertion: 'result.status === 200'
          }
        ]
      });

      expect(test.name).toBe('Test Name');
      expect(test.input).toEqual({ data: 'test' });
      expect(test.expectedOutput).toEqual({ result: 'success' });
      expect(test.assertions).toHaveLength(1);
      expect(test.assertions[0].description).toBe('Custom assertion');
    });

    test('should use empty object for input if not provided', () => {
      const test = creator.createTestCase('Test Name', 'workflow-id');
      expect(test.input).toEqual({});
    });
  });

  describe('saveTestCases', () => {
    test('should save test cases to file', () => {
      const testCases: TestCase[] = [
        {
          name: 'Test 1',
          workflows: [],
          assertions: []
        },
        {
          name: 'Test 2',
          workflows: [],
          assertions: []
        }
      ];

      const filePath = 'test-save-cases.json';
      creator.saveTestCases(testCases, filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      
      const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(saved).toHaveLength(2);
      expect(saved[0].name).toBe('Test 1');
      expect(saved[1].name).toBe('Test 2');

      // Clean up
      fs.unlinkSync(filePath);
    });

    test('should create directory if it does not exist', () => {
      const testCases: TestCase[] = [
        {
          name: 'Test 1',
          workflows: [],
          assertions: []
        }
      ];

      const testDir = path.join(process.cwd(), 'test-dir-create');
      const filePath = path.join(testDir, 'test.json');
      
      creator.saveTestCases(testCases, filePath);

      expect(fs.existsSync(filePath)).toBe(true);

      // Clean up
      fs.rmSync(testDir, { recursive: true, force: true });
    });
  });

  describe('loadTestCases', () => {
    test('should load test cases from file', () => {
      const testCases: TestCase[] = [
        {
          name: 'Test 1',
          workflows: [],
          assertions: []
        },
        {
          name: 'Test 2',
          workflows: [],
          assertions: []
        }
      ];

      const filePath = 'test-load-cases.json';
      fs.writeFileSync(filePath, JSON.stringify(testCases));

      const loaded = creator.loadTestCases(filePath);

      expect(loaded).toHaveLength(2);
      expect(loaded[0].name).toBe('Test 1');
      expect(loaded[1].name).toBe('Test 2');

      // Clean up
      fs.unlinkSync(filePath);
    });

    test('should throw error if file does not exist', () => {
      expect(() => {
        creator.loadTestCases('non-existent-file.json');
      }).toThrow('File not found');
    });

    test('should throw error for invalid JSON', () => {
      const filePath = 'test-invalid.json';
      fs.writeFileSync(filePath, 'invalid json');

      expect(() => {
        creator.loadTestCases(filePath);
      }).toThrow('Failed to parse test file');

      // Clean up
      fs.unlinkSync(filePath);
    });
  });

  describe('createTestFileFromWorkflow', () => {
    test('should create test file from workflow', async () => {
      // Mock the workflow manager's getWorkflow method
      const mockManager = {
        getWorkflow: jest.fn().mockResolvedValue({
          id: 'workflow-id',
          name: 'Test Workflow',
          nodes: [],
          connections: {}
        })
      };

      const outputPath = 'test-from-workflow.json';
      
      await creator.createTestFileFromWorkflow(
        'workflow-id',
        outputPath,
        {
          manager: mockManager as any,
          testName: 'Generated Test'
        }
      );

      expect(fs.existsSync(outputPath)).toBe(true);
      
      const saved = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe('Generated Test');

      // Clean up
      fs.unlinkSync(outputPath);
    });

    test('should use workflow name if test name not provided', async () => {
      const mockManager = {
        getWorkflow: jest.fn().mockResolvedValue({
          id: 'workflow-id',
          name: 'My Workflow',
          nodes: [],
          connections: {}
        })
      };

      const outputPath = 'test-default-name.json';
      
      await creator.createTestFileFromWorkflow(
        'workflow-id',
        outputPath,
        {
          manager: mockManager as any
        }
      );

      const saved = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(saved[0].name).toBe('Test for My Workflow');

      // Clean up
      fs.unlinkSync(outputPath);
    });

    test('should include custom assertions if provided', async () => {
      const mockManager = {
        getWorkflow: jest.fn().mockResolvedValue({
          id: 'workflow-id',
          name: 'Test Workflow',
          nodes: [],
          connections: {}
        })
      };

      const customAssertions = [
        {
          description: 'Custom assertion 1',
          assertion: 'result.status === 200'
        }
      ];

      const outputPath = 'test-custom-assertions.json';
      
      await creator.createTestFileFromWorkflow(
        'workflow-id',
        outputPath,
        {
          manager: mockManager as any,
          assertions: customAssertions
        }
      );

      const saved = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(saved[0].assertions).toHaveLength(1);
      expect(saved[0].assertions[0].description).toBe('Custom assertion 1');

      // Clean up
      fs.unlinkSync(outputPath);
    });

    test('should include input data if provided', async () => {
      const mockManager = {
        getWorkflow: jest.fn().mockResolvedValue({
          id: 'workflow-id',
          name: 'Test Workflow',
          nodes: [],
          connections: {}
        })
      };

      const inputData = {
        test: 'data',
        value: 123
      };

      const outputPath = 'test-with-input.json';
      
      await creator.createTestFileFromWorkflow(
        'workflow-id',
        outputPath,
        {
          manager: mockManager as any,
          input: inputData
        }
      );

      const saved = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(saved[0].input).toEqual(inputData);

      // Clean up
      fs.unlinkSync(outputPath);
    });
  });
});