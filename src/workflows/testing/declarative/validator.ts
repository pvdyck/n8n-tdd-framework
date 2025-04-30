import { Assertion, TestCase, TestCredential, TestWorkflow } from '../../../testing/types';
import { TestValidator } from './types';

/**
 * Validator for declarative tests
 */
export class DeclarativeTestValidator implements TestValidator {
  /**
   * Validate a test case
   *
   * @param testCase - Test case to validate
   * @returns Validation errors, if any
   */
  validateTestCase(testCase: TestCase): string[] {
    const errors: string[] = [];

    // Validate required fields
    if (!testCase.name) {
      errors.push('Test name is required');
    }

    if (!testCase.workflows || !Array.isArray(testCase.workflows) || testCase.workflows.length === 0) {
      errors.push('At least one workflow is required');
    } else {
      // Validate workflows
      testCase.workflows.forEach((workflow, index) => {
        const workflowErrors = this.validateTestWorkflow(workflow);
        workflowErrors.forEach(error => {
          errors.push(`Workflow ${index} (${workflow.name}): ${error}`);
        });
      });

      // Check for primary workflow
      const primaryWorkflows = testCase.workflows.filter(w => w.isPrimary);
      if (primaryWorkflows.length === 0) {
        errors.push('At least one workflow must be marked as primary');
      } else if (primaryWorkflows.length > 1) {
        errors.push('Only one workflow can be marked as primary');
      }
    }

    // Validate credentials if present
    if (testCase.credentials && Array.isArray(testCase.credentials)) {
      testCase.credentials.forEach((credential, index) => {
        const credentialErrors = this.validateTestCredential(credential);
        credentialErrors.forEach(error => {
          errors.push(`Credential ${index} (${credential.name}): ${error}`);
        });
      });
    }

    // Validate assertions if present
    if (testCase.assertions && Array.isArray(testCase.assertions)) {
      if (testCase.assertions.length === 0) {
        errors.push('At least one assertion is recommended');
      } else {
        testCase.assertions.forEach((assertion, index) => {
          const assertionErrors = this.validateAssertion(assertion);
          assertionErrors.forEach(error => {
            errors.push(`Assertion ${index}: ${error}`);
          });
        });
      }
    }

    return errors;
  }

  /**
   * Validate a test workflow
   *
   * @param workflow - Test workflow to validate
   * @returns Validation errors, if any
   */
  validateTestWorkflow(workflow: TestWorkflow): string[] {
    const errors: string[] = [];

    if (!workflow.templateName) {
      errors.push('Template name is required');
    }

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    return errors;
  }

  /**
   * Validate a test credential
   *
   * @param credential - Test credential to validate
   * @returns Validation errors, if any
   */
  validateTestCredential(credential: TestCredential): string[] {
    const errors: string[] = [];

    if (!credential.name) {
      errors.push('Credential name is required');
    }

    return errors;
  }

  /**
   * Validate an assertion
   *
   * @param assertion - Assertion to validate
   * @returns Validation errors, if any
   */
  validateAssertion(assertion: Assertion): string[] {
    const errors: string[] = [];

    if (!assertion.description) {
      errors.push('Assertion description is required');
    }

    if (!assertion.assertion) {
      errors.push('Assertion expression is required');
    } else {
      // Basic syntax validation
      try {
        // Try to create a function from the assertion to check syntax
        // eslint-disable-next-line no-new-func
        new Function('result', `return ${assertion.assertion}`);
      } catch (error) {
        errors.push(`Invalid assertion syntax: ${(error as Error).message}`);
      }
    }

    return errors;
  }
}

/**
 * Create a new declarative test validator
 *
 * @returns A new validator instance
 */
export function createValidator(): TestValidator {
  return new DeclarativeTestValidator();
}