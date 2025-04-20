import { Assertion, TestCase, TestCredential, TestResult, TestRunResult, TestWorkflow } from '../../../testing/types';

/**
 * Configuration for the declarative test runner
 */
export interface DeclarativeTestConfig {
  /**
   * Base directory for test files
   */
  testsDir?: string;
  
  /**
   * Base directory for workflow templates
   */
  templatesDir?: string;
  
  /**
   * Whether to clean up resources after tests
   */
  cleanupAfterTests?: boolean;
  
  /**
   * Default timeout for tests in milliseconds
   */
  defaultTimeout?: number;
  
  /**
   * Reporter to use for test results
   */
  reporter?: 'console' | 'json' | 'none';
  
  /**
   * Path to write JSON report to
   */
  reportPath?: string;
  
  /**
   * Tags to filter tests by
   */
  tags?: string[];
  
  /**
   * Whether to continue running tests after a failure
   */
  continueOnFailure?: boolean;
}

/**
 * Reporter interface for test results
 */
export interface TestReporter {
  /**
   * Report a test result
   * 
   * @param result - Test result
   */
  reportTestResult(result: TestResult): void;
  
  /**
   * Report the final test run result
   * 
   * @param result - Test run result
   */
  reportRunResult(result: TestRunResult): void;
}

/**
 * Test validator interface
 */
export interface TestValidator {
  /**
   * Validate a test case
   * 
   * @param testCase - Test case to validate
   * @returns Validation errors, if any
   */
  validateTestCase(testCase: TestCase): string[];
  
  /**
   * Validate a test workflow
   * 
   * @param workflow - Test workflow to validate
   * @returns Validation errors, if any
   */
  validateTestWorkflow(workflow: TestWorkflow): string[];
  
  /**
   * Validate a test credential
   * 
   * @param credential - Test credential to validate
   * @returns Validation errors, if any
   */
  validateTestCredential(credential: TestCredential): string[];
  
  /**
   * Validate an assertion
   * 
   * @param assertion - Assertion to validate
   * @returns Validation errors, if any
   */
  validateAssertion(assertion: Assertion): string[];
}

/**
 * Test creator interface
 */
export interface TestCreator {
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
  ): TestCase;
  
  /**
   * Save test cases to a file
   * 
   * @param testCases - Test cases to save
   * @param filePath - File path to save to
   * @returns The path to the saved file
   */
  saveTestCases(testCases: TestCase[], filePath: string): string;
  
  /**
   * Load test cases from a file
   * 
   * @param filePath - File path to load from
   * @returns The loaded test cases
   */
  loadTestCases(filePath: string): TestCase[];
}

/**
 * Resource manager interface for tests
 */
export interface TestResourceManager {
  /**
   * Create resources for a test
   * 
   * @param testCase - Test case to create resources for
   * @returns Created resource IDs
   */
  createResources(testCase: TestCase): Promise<{
    workflowIds: { [name: string]: string };
    credentialIds: { [name: string]: string };
    primaryWorkflowId: string;
  }>;
  
  /**
   * Clean up resources for a test
   * 
   * @param resourceIds - Resource IDs to clean up
   */
  cleanupResources(resourceIds: {
    workflowIds: { [name: string]: string };
    credentialIds: { [name: string]: string };
  }): Promise<void>;
}