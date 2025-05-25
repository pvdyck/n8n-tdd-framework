/**
 * Retry utility for handling transient failures
 */

import { N8nTddError, TimeoutError } from '../errors';

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Initial delay between retries in milliseconds
   */
  initialDelay?: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelay?: number;
  
  /**
   * Backoff multiplier for exponential backoff
   */
  backoffMultiplier?: number;
  
  /**
   * Timeout for the entire operation in milliseconds
   */
  timeout?: number;
  
  /**
   * Function to determine if an error is retryable
   */
  isRetryable?: (error: any) => boolean;
  
  /**
   * Callback function called before each retry
   */
  onRetry?: (error: any, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  timeout: 60000,
  isRetryable: (error) => {
    // Retry on network errors and 5xx status codes
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }
    // Retry on rate limiting
    if (error.statusCode === 429) {
      return true;
    }
    return false;
  },
  onRetry: () => {}
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: any;
  
  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      // Check timeout
      if (opts.timeout && Date.now() - startTime > opts.timeout) {
        throw new TimeoutError('withRetry', opts.timeout, { attempts: attempt - 1 });
      }
      
      // Execute the function
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (!opts.isRetryable(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      // Call retry callback
      opts.onRetry(error, attempt);
      
      // Wait before retrying
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  throw new N8nTddError(
    `Operation failed after ${opts.maxRetries} attempts`,
    {
      lastError,
      attempts: opts.maxRetries
    }
  );
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retry wrapper with preset options
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> => {
    return withRetry(fn, { ...defaultOptions, ...options });
  };
}