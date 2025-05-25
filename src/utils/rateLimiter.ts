/**
 * Rate limiter for API requests
 */

import { TimeoutError } from '../errors';

export interface RateLimiterOptions {
  /**
   * Maximum number of requests per interval
   */
  maxRequests: number;
  
  /**
   * Interval in milliseconds
   */
  interval: number;
  
  /**
   * Maximum time to wait for a slot in milliseconds
   */
  maxWaitTime?: number;
}

/**
 * Token bucket rate limiter
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly maxWaitTime: number;
  private queue: Array<() => void> = [];

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxRequests;
    this.tokens = this.maxTokens;
    this.refillRate = options.maxRequests / options.interval;
    this.lastRefill = Date.now();
    this.maxWaitTime = options.maxWaitTime || 60000; // Default 60 seconds
  }

  /**
   * Acquire a token for making a request
   */
  async acquire(): Promise<void> {
    // Refill tokens based on elapsed time
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // No tokens available, need to wait
    const waitTime = this.getWaitTime();
    
    if (waitTime > this.maxWaitTime) {
      throw new TimeoutError(
        'Rate limit acquire',
        this.maxWaitTime,
        { waitTime, availableTokens: this.tokens }
      );
    }

    // Wait for a token to become available
    return new Promise((resolve) => {
      this.queue.push(resolve);
      setTimeout(() => {
        this.processQueue();
      }, waitTime);
    });
  }

  /**
   * Get the current number of available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get the wait time until a token becomes available
   */
  private getWaitTime(): number {
    const tokensNeeded = 1 - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate);
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Process waiting requests in the queue
   */
  private processQueue(): void {
    this.refill();
    
    while (this.queue.length > 0 && this.tokens >= 1) {
      const resolve = this.queue.shift()!;
      this.tokens -= 1;
      resolve();
    }
  }
}

/**
 * Create a rate-limited function wrapper
 */
export function createRateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  rateLimiter: RateLimiter
): T {
  return (async (...args: Parameters<T>) => {
    await rateLimiter.acquire();
    return fn(...args);
  }) as T;
}