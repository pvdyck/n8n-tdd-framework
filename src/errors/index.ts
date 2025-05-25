/**
 * Custom error classes for n8n-tdd-framework
 */

export interface ErrorDetails {
  statusCode?: number;
  request?: any;
  response?: any;
  [key: string]: any;
}

/**
 * Base error class for all framework errors
 */
export class N8nTddError extends Error {
  public readonly details?: ErrorDetails;
  public readonly timestamp: Date;

  constructor(message: string, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when API connection fails
 */
export class ConnectionError extends N8nTddError {
  constructor(message: string, details?: ErrorDetails) {
    super(`Connection failed: ${message}`, details);
  }
}

/**
 * Error thrown when workflow operations fail
 */
export class WorkflowError extends N8nTddError {
  constructor(message: string, details?: ErrorDetails) {
    super(`Workflow error: ${message}`, details);
  }
}

/**
 * Error thrown when credential operations fail
 */
export class CredentialError extends N8nTddError {
  constructor(message: string, details?: ErrorDetails) {
    super(`Credential error: ${message}`, details);
  }
}

/**
 * Error thrown when API requests fail
 */
export class ApiError extends N8nTddError {
  public readonly statusCode: number;
  public readonly statusText: string;

  constructor(statusCode: number, statusText: string, message: string, details?: ErrorDetails) {
    super(`API error (${statusCode}): ${message}`, { ...details, statusCode });
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends N8nTddError {
  constructor(message: string, details?: ErrorDetails) {
    super(`Validation error: ${message}`, details);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends N8nTddError {
  constructor(message: string, details?: ErrorDetails) {
    super(`Configuration error: ${message}`, details);
  }
}

/**
 * Error thrown when Docker operations fail
 */
export class DockerError extends N8nTddError {
  constructor(message: string, details?: ErrorDetails) {
    super(`Docker error: ${message}`, details);
  }
}

/**
 * Error thrown when timeout occurs
 */
export class TimeoutError extends N8nTddError {
  public readonly timeout: number;

  constructor(operation: string, timeout: number, details?: ErrorDetails) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, { ...details, timeout });
    this.timeout = timeout;
  }
}