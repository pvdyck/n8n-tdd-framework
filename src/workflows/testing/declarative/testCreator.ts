import fs from 'fs';
import path from 'path';
import { Assertion, TestCase } from '../../../testing/types';
import { TestCreator } from './types';

/**
 * Creator for declarative tests
 */
export class DeclarativeTestCreator implements TestCreator {
  /**
   * Create a test case
   * 
   * @param name - Test name
   * @param workflowId - Workflow ID
   * @param options - Test options
   * @returns The created test case
   */
  createTestCase(
    name: string,
    workflowId: string,
    options?: {
      input?: Record<string, any>;
      expectedOutput?: Record<string, any>;
      assertions?: Assertion[];
    }
  ): TestCase {
    return {
      name,
      workflows: [
        {
          templateName: 'custom',
          name: `${name} Workflow`,
          isPrimary: true
        }
      ],
      input: options?.input || {},
      expectedOutput: options?.expectedOutput,
      assertions: options?.assertions || [
        {
          description: 'Default assertion',
          assertion: 'result !== undefined'
        }
      ]
    };
  }
  
  /**
   * Save test cases to a file
   * 
   * @param testCases - Test cases to save
   * @param filePath - File path to save to
   * @returns The path to the saved file
   */
  saveTestCases(testCases: TestCase[], filePath: string): string {
    const fullPath = path.resolve(process.cwd(), filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, JSON.stringify(testCases, null, 2));
    
    return fullPath;
  }
  
  /**
   * Load test cases from a file
   * 
   * @param filePath - File path to load from
   * @returns The loaded test cases
   */
  loadTestCases(filePath: string): TestCase[] {
    const fullPath = path.resolve(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Test file not found: ${fullPath}`);
    }
    
    try {
      const testCases = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      
      if (!Array.isArray(testCases)) {
        throw new Error('Test file must contain an array of test cases');
      }
      
      return testCases;
    } catch (error) {
      throw new Error(`Failed to parse test file: ${(error as Error).message}`);
    }
  }
  
  /**
   * Create a test file from a workflow
   * 
   * @param workflowId - Workflow ID
   * @param name - Test name
   * @param filePath - File path to save to
   * @returns The path to the saved file
   */
  async createTestFileFromWorkflow(
    workflowId: string,
    name: string,
    filePath: string
  ): Promise<string> {
    const testCase = this.createTestCase(name, workflowId);
    return this.saveTestCases([testCase], filePath);
  }
}

/**
 * Create a new declarative test creator
 * 
 * @returns A new creator instance
 */
export function createTestCreator(): TestCreator {
  return new DeclarativeTestCreator();
}