import fs from 'fs';
import path from 'path';
import WorkflowManager from '../../manager';
import { Assertion, Credential, TestCase, TestCredential, TestResult, TestRunResult } from '../../../testing/types';
import { DeclarativeTestConfig, TestReporter, TestResourceManager, TestValidator } from './types';
import { DeclarativeTestValidator } from './validator';
import { DeclarativeTestCreator } from './testCreator';
import { getConfig } from '../../../config/config';

/**
 * Console reporter for test results
 */
class ConsoleReporter implements TestReporter {
  reportTestResult(result: TestResult): void {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);

    if (!result.passed && result.error) {
      console.log(`  Error: ${result.error}`);
    }

    if (result.assertions) {
      result.assertions.forEach(assertion => {
        const assertionStatus = assertion.passed ? '✓' : '✗';
        console.log(`  ${assertionStatus} ${assertion.description}`);

        if (!assertion.passed && assertion.error) {
          console.log(`    Error: ${assertion.error}`);
        }
      });
    }

    console.log('');
  }

  reportRunResult(result: TestRunResult): void {
    console.log('Test Run Summary:');
    console.log(`Total: ${result.total}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Duration: ${result.duration}ms`);

    if (result.failed > 0) {
      console.log('\nFailed Tests:');
      result.failures.forEach(failure => {
        console.log(`- ${failure.testName}: ${failure.message}`);
      });
    }
  }
}

/**
 * JSON reporter for test results
 */
class JsonReporter implements TestReporter {
  private reportPath: string;

  constructor(reportPath: string) {
    this.reportPath = reportPath;
  }

  reportTestResult(result: TestResult): void {
    // JSON reporter only reports the final result
  }

  reportRunResult(result: TestRunResult): void {
    const reportDir = path.dirname(this.reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(this.reportPath, JSON.stringify(result, null, 2));
    console.log(`Test report written to: ${this.reportPath}`);
  }
}

/**
 * No-op reporter for test results
 */
class NoopReporter implements TestReporter {
  reportTestResult(result: TestResult): void {
    // Do nothing
  }

  reportRunResult(result: TestRunResult): void {
    // Do nothing
  }
}

/**
 * Resource manager for declarative tests
 */
class DeclarativeTestResourceManager implements TestResourceManager {
  private manager: WorkflowManager;

  constructor(manager: WorkflowManager) {
    this.manager = manager;
  }

  async createResources(testCase: TestCase): Promise<{
    workflowIds: { [name: string]: string };
    credentialIds: { [name: string]: string };
    primaryWorkflowId: string;
  }> {
    const workflowIds: { [name: string]: string } = {};
    const credentialIds: { [name: string]: string } = {};
    let primaryWorkflowId = '';

    // Create credentials first so they can be used by workflows
    if (testCase.credentials) {
      for (const testCredential of testCase.credentials) {
        try {
          // Always create credential from environment variables
          const createdCredential = await this.manager.createCredentialFromEnv(
            testCredential.name,
            { envPrefix: testCredential.envPrefix }
          );

          // Store the credential ID
          credentialIds[testCredential.name] = createdCredential.id!;
        } catch (error) {
          console.error(`Error creating credential ${testCredential.name}: ${(error as Error).message}`);
          throw new Error(`Failed to create credential ${testCredential.name}: ${(error as Error).message}`);
        }
      }
    }

    // Create workflows
    for (const workflow of testCase.workflows) {
      const createdWorkflow = await this.manager.createWorkflowFromTemplate(
        workflow.templateName,
        workflow.name,
        workflow.settings
      );

      workflowIds[workflow.name] = createdWorkflow.id!;

      if (workflow.isPrimary) {
        primaryWorkflowId = createdWorkflow.id!;
      }

      if (workflow.activate) {
        await this.manager.activateWorkflow(createdWorkflow.id!);
      }
    }

    return {
      workflowIds,
      credentialIds,
      primaryWorkflowId
    };
  }

  async cleanupResources(resourceIds: {
    workflowIds: { [name: string]: string };
    credentialIds: { [name: string]: string };
  }): Promise<void> {
    // Delete workflows first
    for (const name in resourceIds.workflowIds) {
      try {
        const id = resourceIds.workflowIds[name];
        await this.manager.deleteWorkflow(id);
      } catch (error) {
        console.error(`Error deleting workflow ${name}: ${(error as Error).message}`);
      }
    }

    // Delete credentials
    for (const name in resourceIds.credentialIds) {
      try {
        const id = resourceIds.credentialIds[name];
        await this.manager.deleteCredential(id);
      } catch (error) {
        console.error(`Error deleting credential ${name}: ${(error as Error).message}`);
      }
    }
  }
}

/**
 * Runner for declarative tests
 */
export class DeclarativeTestRunner {
  private manager: WorkflowManager;
  private validator: TestValidator;
  private resourceManager: TestResourceManager;
  private config: DeclarativeTestConfig;

  /**
   * Create a new DeclarativeTestRunner
   *
   * @param options - Runner options
   */
  constructor(options?: DeclarativeTestConfig) {
    const frameworkConfig = getConfig();

    this.config = {
      testsDir: options?.testsDir || frameworkConfig.testsDir || './tests',
      templatesDir: options?.templatesDir || frameworkConfig.templatesDir || './templates',
      cleanupAfterTests: options?.cleanupAfterTests !== undefined ? options.cleanupAfterTests : true,
      defaultTimeout: options?.defaultTimeout || 30000,
      reporter: options?.reporter || 'console',
      reportPath: options?.reportPath || './test-results.json',
      continueOnFailure: options?.continueOnFailure !== undefined ? options.continueOnFailure : true
    };

    this.manager = new WorkflowManager({
      templatesDir: this.config.templatesDir
    });

    this.validator = new DeclarativeTestValidator();
    this.resourceManager = new DeclarativeTestResourceManager(this.manager);
  }

  /**
   * Create a reporter based on the configuration
   *
   * @returns A test reporter
   */
  private createReporter(): TestReporter {
    switch (this.config.reporter) {
      case 'console':
        return new ConsoleReporter();

      case 'json':
        return new JsonReporter(this.config.reportPath!);

      case 'none':
        return new NoopReporter();

      default:
        return new ConsoleReporter();
    }
  }

  /**
   * Run a single test case
   *
   * @param testCase - Test case to run
   * @returns The test result
   */
  async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();

    // Validate the test case
    const validationErrors = this.validator.validateTestCase(testCase);
    if (validationErrors.length > 0) {
      return {
        name: testCase.name,
        passed: false,
        error: `Validation errors: ${validationErrors.join(', ')}`,
        duration: Date.now() - startTime,
        workflows: []
      };
    }

    // Skip the test if marked as skipped
    if (testCase.skip) {
      return {
        name: testCase.name,
        passed: true,
        duration: 0,
        workflows: []
      };
    }

    let resourceIds: {
      workflowIds: { [name: string]: string };
      credentialIds: { [name: string]: string };
      primaryWorkflowId: string;
    } | null = null;

    try {
      // Connect to n8n
      await this.manager.connect();

      // Create resources
      resourceIds = await this.resourceManager.createResources(testCase);

      // Execute the primary workflow
      const result = await this.manager.executeWorkflow(
        resourceIds.primaryWorkflowId,
        testCase.input
      );

      // Evaluate assertions
      const assertionResults = this.evaluateAssertions(testCase.assertions || [], result);

      // Check if all assertions passed
      const allAssertionsPassed = assertionResults.every(a => a.passed);

      return {
        name: testCase.name,
        passed: allAssertionsPassed,
        output: result,
        assertions: assertionResults,
        duration: Date.now() - startTime,
        workflows: Object.entries(resourceIds.workflowIds).map(([name, id]) => ({ name, id })),
        credentials: Object.entries(resourceIds.credentialIds).map(([name, id]) => ({ name, id }))
      };
    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        error: `Test execution failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        workflows: resourceIds ? Object.entries(resourceIds.workflowIds).map(([name, id]) => ({ name, id })) : [],
        credentials: resourceIds ? Object.entries(resourceIds.credentialIds).map(([name, id]) => ({ name, id })) : []
      };
    } finally {
      // Clean up resources if needed
      if (this.config.cleanupAfterTests && resourceIds) {
        try {
          await this.resourceManager.cleanupResources(resourceIds);
        } catch (error) {
          console.error(`Error cleaning up resources: ${(error as Error).message}`);
        }
      }

      // Disconnect from n8n
      await this.manager.disconnect();
    }
  }

  /**
   * Evaluate assertions against a result
   *
   * @param assertions - Assertions to evaluate
   * @param result - Result to evaluate against
   * @returns Assertion results
   */
  private evaluateAssertions(assertions: Assertion[], result: any): { description: string; passed: boolean; error?: string }[] {
    return assertions.map(assertion => {
      try {
        // Create a function from the assertion
        // eslint-disable-next-line no-new-func
        const assertionFn = new Function('result', `return ${assertion.assertion}`);

        // Evaluate the assertion
        const passed = assertionFn(result);

        return {
          description: assertion.description,
          passed: Boolean(passed)
        };
      } catch (error) {
        return {
          description: assertion.description,
          passed: false,
          error: `Assertion evaluation failed: ${(error as Error).message}`
        };
      }
    });
  }

  /**
   * Run tests from a file
   *
   * @param filePath - Path to the test file
   * @returns The test run result
   */
  async runTestsFromFile(filePath: string): Promise<TestRunResult> {
    const creator = new DeclarativeTestCreator();
    const testCases = creator.loadTestCases(filePath);

    return this.runTests(testCases);
  }

  /**
   * Run tests from a directory
   *
   * @param dirPath - Path to the test directory
   * @returns The test run result
   */
  async runTestsFromDirectory(dirPath: string = this.config.testsDir!): Promise<TestRunResult> {
    const fullPath = path.resolve(process.cwd(), dirPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Test directory not found: ${fullPath}`);
    }

    const files = fs.readdirSync(fullPath)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(fullPath, file));

    const creator = new DeclarativeTestCreator();
    const allTestCases: TestCase[] = [];

    for (const file of files) {
      const testCases = creator.loadTestCases(file);
      allTestCases.push(...testCases);
    }

    return this.runTests(allTestCases);
  }

  /**
   * Run a list of test cases
   *
   * @param testCases - Test cases to run
   * @returns The test run result
   */
  async runTests(testCases: TestCase[]): Promise<TestRunResult> {
    const startTime = Date.now();
    const reporter = this.createReporter();

    // Filter tests by tags if specified
    let filteredTests = testCases;
    if (this.config.tags && this.config.tags.length > 0) {
      filteredTests = testCases.filter(test => {
        if (!test.tags || test.tags.length === 0) {
          return false;
        }

        return this.config.tags!.some(tag => test.tags!.includes(tag));
      });
    }

    const results: TestResult[] = [];
    const failures: { testName: string; message: string }[] = [];

    for (const testCase of filteredTests) {
      try {
        const result = await this.runTest(testCase);
        results.push(result);

        // Report the test result
        reporter.reportTestResult(result);

        if (!result.passed) {
          failures.push({
            testName: result.name,
            message: result.error || 'Assertions failed'
          });

          if (!this.config.continueOnFailure) {
            break;
          }
        }
      } catch (error) {
        const result: TestResult = {
          name: testCase.name,
          passed: false,
          error: `Unexpected error: ${(error as Error).message}`,
          duration: 0,
          workflows: []
        };

        results.push(result);
        reporter.reportTestResult(result);

        failures.push({
          testName: testCase.name,
          message: `Unexpected error: ${(error as Error).message}`
        });

        if (!this.config.continueOnFailure) {
          break;
        }
      }
    }

    const runResult: TestRunResult = {
      total: filteredTests.length,
      passed: results.filter(r => r.passed).length,
      failed: failures.length,
      skipped: filteredTests.filter(t => t.skip).length,
      results,
      failures,
      duration: Date.now() - startTime
    };

    // Report the run result
    reporter.reportRunResult(runResult);

    return runResult;
  }
}

/**
 * Create a new declarative test runner
 *
 * @param options - Runner options
 * @returns A new runner instance
 */
export function createRunner(options?: DeclarativeTestConfig): DeclarativeTestRunner {
  return new DeclarativeTestRunner(options);
}