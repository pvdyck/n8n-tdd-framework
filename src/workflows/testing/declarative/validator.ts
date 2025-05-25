import { Assertion, TestCase, TestCredential, TestWorkflow } from '../../../testing/types';
import { TestValidator } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validator for declarative tests
 */
export class DeclarativeTestValidator implements TestValidator {
  /**
   * Validate a test case (returns string array for interface compatibility)
   *
   * @param testCase - Test case to validate
   * @returns Validation errors
   */
  validateTestCase(testCase: TestCase): string[] {
    return this._validateTestCase(testCase).errors;
  }

  /**
   * Alternative method name for clarity
   */
  validateTestCaseErrors(testCase: TestCase): string[] {
    return this.validateTestCase(testCase);
  }

  /**
   * Internal validation with full result
   *
   * @param testCase - Test case to validate
   * @returns Validation result
   */
  private _validateTestCase(testCase: TestCase): ValidationResult {
    const errors: string[] = [];

    // Handle null/undefined/malformed input
    if (!testCase || typeof testCase !== 'object') {
      return {
        valid: false,
        errors: ['Invalid test case: must be an object']
      };
    }

    // Validate required fields
    if (!testCase.name) {
      errors.push('Test name is required');
    }

    if (!testCase.workflows || !Array.isArray(testCase.workflows)) {
      errors.push('Test case must have a workflows array');
    } else if (testCase.workflows.length === 0) {
      errors.push('Test case must have at least one workflow');
    } else {
      // Validate workflows
      testCase.workflows.forEach((workflow, index) => {
        const workflowResult = this.validateWorkflow(workflow);
        workflowResult.errors.forEach(error => {
          errors.push(`Workflow ${index} (${workflow.name || 'unnamed'}): ${error}`);
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
        const credentialResult = this.validateCredential(credential);
        credentialResult.errors.forEach(error => {
          errors.push(`Credential ${index} (${credential.name || 'unnamed'}): ${error}`);
        });
      });
    }

    // Validate assertions if present
    if (testCase.assertions && Array.isArray(testCase.assertions)) {
      testCase.assertions.forEach((assertion, index) => {
        const assertionResult = this._validateAssertion(assertion);
        assertionResult.errors.forEach(error => {
          errors.push(`Assertion ${index}: ${error}`);
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a test workflow (returns string array)
   *
   * @param workflow - Test workflow to validate
   * @returns Validation errors
   */
  validateTestWorkflow(workflow: TestWorkflow): string[] {
    return this.validateWorkflow(workflow).errors;
  }

  /**
   * Validate a workflow
   *
   * @param workflow - Test workflow to validate
   * @returns Validation result
   */
  validateWorkflow(workflow: TestWorkflow): ValidationResult {
    const errors: string[] = [];

    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    // Must have either templateName or inline workflow definition
    if (!workflow.templateName && (!workflow.nodes || !workflow.connections)) {
      errors.push('Workflow must have either templateName or inline workflow definition (nodes and connections)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a test credential (returns string array)
   *
   * @param credential - Test credential to validate
   * @returns Validation errors
   */
  validateTestCredential(credential: TestCredential): string[] {
    return this.validateCredential(credential).errors;
  }

  /**
   * Validate a credential
   *
   * @param credential - Test credential to validate
   * @returns Validation result
   */
  validateCredential(credential: TestCredential): ValidationResult {
    const errors: string[] = [];

    if (!credential.name) {
      errors.push('Credential name is required');
    }

    // If data is provided, type must also be provided
    if (credential.data && !credential.type) {
      errors.push('Credential type is required when data is provided');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate an assertion (returns string array)
   *
   * @param assertion - Assertion to validate
   * @returns Validation errors
   */
  validateAssertion(assertion: Assertion): string[] {
    return this._validateAssertion(assertion).errors;
  }

  /**
   * Internal assertion validation
   *
   * @param assertion - Assertion to validate
   * @returns Validation result
   */
  private _validateAssertion(assertion: Assertion): ValidationResult {
    const errors: string[] = [];

    if (!assertion.description) {
      errors.push('Assertion description is required');
    }

    // Type-specific validation
    if (assertion.type === 'property') {
      if (!assertion.path) {
        errors.push('Property assertion requires a path');
      }
      if (assertion.expected === undefined) {
        errors.push('Property assertion requires an expected value');
      }
    } else if (assertion.type === 'regex') {
      if (!assertion.path) {
        errors.push('Regex assertion requires a path');
      }
      if (!assertion.pattern) {
        errors.push('Regex assertion requires a pattern');
      }
    } else if (assertion.type === 'schema') {
      if (!assertion.schema) {
        errors.push('Schema assertion requires a schema');
      }
    } else if (!assertion.type || assertion.type === 'expression') {
      // Default to expression type
      if (!assertion.assertion) {
        errors.push('Expression assertion requires an assertion expression');
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
    } else {
      errors.push(`Unknown assertion type: ${assertion.type}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
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