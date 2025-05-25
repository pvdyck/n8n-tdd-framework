/**
 * Represents a workflow in n8n
 */
export interface Workflow {
  /**
   * Workflow ID
   */
  id?: string;

  /**
   * Workflow name
   */
  name: string;

  /**
   * Whether the workflow is active
   */
  active?: boolean;

  /**
   * Workflow nodes
   */
  nodes: WorkflowNode[];

  /**
   * Workflow connections
   */
  connections: Record<string, Record<string, Connection[][]>>;

  /**
   * Workflow settings
   */
  settings?: WorkflowSettings;

  /**
   * Workflow tags
   */
  tags?: string[];
}

/**
 * Represents a node in a workflow
 */
export interface WorkflowNode {
  /**
   * Node ID
   */
  id?: string;

  /**
   * Node name
   */
  name: string;

  /**
   * Node type
   */
  type: string;

  /**
   * Node type version
   */
  typeVersion?: number;

  /**
   * Node position
   */
  position: [number, number];

  /**
   * Node parameters
   */
  parameters: Record<string, any>;

  /**
   * Node credentials
   */
  credentials?: Record<string, any>;
}

/**
 * Represents a connection between nodes
 */
export interface Connection {
  /**
   * Source node
   */
  node: string;

  /**
   * Source output index
   */
  type: string;

  /**
   * Source output index
   */
  index: number;
}

/**
 * Represents workflow settings
 */
export interface WorkflowSettings {
  /**
   * Error workflow ID
   */
  errorWorkflow?: string;

  /**
   * Save execution progress
   */
  saveExecutionProgress?: boolean;

  /**
   * Save manual executions
   */
  saveManualExecutions?: boolean;

  /**
   * Timezone
   */
  timezone?: string;
}

/**
 * Represents a test case
 */
export interface TestCase {
  /**
   * Test name
   */
  name: string;

  /**
   * Test description
   */
  description?: string;

  /**
   * Workflows to create for the test
   */
  workflows: TestWorkflow[];

  /**
   * Credentials to create for the test
   */
  credentials?: TestCredential[];

  /**
   * Input data for the test
   */
  input?: Record<string, any>;

  /**
   * Expected output from the test
   */
  expectedOutput?: Record<string, any>;

  /**
   * Assertions to run against the output
   */
  assertions?: Assertion[];

  /**
   * Tags for the test
   */
  tags?: string[];

  /**
   * Whether to skip this test
   */
  skip?: boolean;

  /**
   * Timeout for the test in milliseconds
   */
  timeout?: number;
}

/**
 * Represents a workflow to create for a test
 */
export interface TestWorkflow {
  /**
   * Template name to use for the workflow
   */
  templateName?: string;

  /**
   * Name for the created workflow
   */
  name: string;

  /**
   * Whether this is the primary workflow for the test
   */
  isPrimary?: boolean;

  /**
   * Settings to override in the template
   */
  settings?: Record<string, any>;

  /**
   * Whether to activate the workflow
   */
  activate?: boolean;

  /**
   * Inline workflow nodes (alternative to templateName)
   */
  nodes?: WorkflowNode[];

  /**
   * Inline workflow connections (alternative to templateName)
   */
  connections?: Record<string, Record<string, Connection[][]>>;
}

/**
 * Represents a credential in n8n
 */
export interface Credential {
  /**
   * Credential ID
   */
  id?: string;

  /**
   * Credential name
   */
  name: string;

  /**
   * Credential type
   */
  type: string;

  /**
   * Credential data
   */
  data: Record<string, any>;

  /**
   * Whether the credential is shared
   */
  shared?: boolean;

  /**
   * Source of the credential (e.g., 'env' for environment variables)
   */
  source?: string;
}

/**
 * Represents a credential to create for a test
 */
export interface TestCredential {
  /**
   * Credential name
   */
  name: string;

  /**
   * Credential type (e.g., 'httpBasicAuth')
   */
  type?: string;

  /**
   * Credential data
   */
  data?: Record<string, any>;

  /**
   * Workflow that uses this credential
   */
  usedByWorkflow?: string;

  /**
   * Node that uses this credential
   */
  usedByNode?: string;

  /**
   * Environment variable prefix for this credential
   * Default is 'N8N_CREDENTIAL_'
   */
  envPrefix?: string;
}

/**
 * Represents an assertion to run against the test output
 */
export interface Assertion {
  /**
   * Type of assertion
   */
  type?: 'expression' | 'property' | 'regex' | 'schema';

  /**
   * Description of the assertion
   */
  description: string;

  /**
   * Assertion expression to evaluate (for expression type)
   */
  assertion?: string;

  /**
   * Property path (for property/regex types)
   */
  path?: string;

  /**
   * Expected value (for property type)
   */
  expected?: any;

  /**
   * Regex pattern (for regex type)
   */
  pattern?: string;

  /**
   * JSON Schema (for schema type)
   */
  schema?: Record<string, any>;
}

/**
 * Represents the result of a test run
 */
export interface TestResult {
  /**
   * Test name
   */
  name: string;

  /**
   * Whether the test passed
   */
  passed: boolean;

  /**
   * Error message if the test failed
   */
  error?: string;

  /**
   * Test output
   */
  output?: any;

  /**
   * Assertion results
   */
  assertions?: AssertionResult[];

  /**
   * Test duration in milliseconds
   */
  duration: number;

  /**
   * Workflows created for the test
   */
  workflows: { id: string; name: string }[];

  /**
   * Credentials created for the test
   */
  credentials?: { id: string; name: string }[];
}

/**
 * Represents the result of an assertion
 */
export interface AssertionResult {
  /**
   * Description of the assertion
   */
  description: string;

  /**
   * Whether the assertion passed
   */
  passed: boolean;

  /**
   * Error message if the assertion failed
   */
  error?: string;
}

/**
 * Represents the result of a test run
 */
export interface TestRunResult {
  /**
   * Total number of tests
   */
  total: number;

  /**
   * Number of passed tests
   */
  passed: number;

  /**
   * Number of failed tests
   */
  failed: number;

  /**
   * Number of skipped tests
   */
  skipped: number;

  /**
   * Test results
   */
  results: TestResult[];

  /**
   * Failed test details
   */
  failures: { testName: string; message: string }[];

  /**
   * Test run duration in milliseconds
   */
  duration: number;
}