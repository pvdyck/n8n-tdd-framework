import axios, { AxiosInstance, AxiosError } from 'axios';
import { BaseN8nClient } from '../interfaces/n8nClient';
import { loadConfig } from '../config/config';
import { ConnectionError, ApiError, ConfigurationError } from '../errors';
import { withRetry, createRetryWrapper } from '../utils/retry';
import { RateLimiter } from '../utils/rateLimiter';

/**
 * Real implementation of the N8nClient interface that connects to an actual n8n instance
 */
export default class RealN8nClient extends BaseN8nClient {
  private client: AxiosInstance | null = null;
  private apiUrl: string;
  private apiKey: string;
  private retryWrapper: <T>(fn: () => Promise<T>) => Promise<T>;
  private rateLimiter: RateLimiter;

  /**
   * Create a new RealN8nClient
   * 
   * @param options - Client options
   */
  constructor(options?: { 
    apiUrl?: string; 
    apiKey?: string;
    maxRequestsPerMinute?: number;
  }) {
    super();
    
    const config = loadConfig();
    
    this.apiUrl = options?.apiUrl || config.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
    this.apiKey = options?.apiKey || config.apiKey || process.env.N8N_API_KEY || '';
    
    if (!this.apiUrl) {
      throw new ConfigurationError('N8N API URL is required. Set it in the options, config file, or N8N_API_URL environment variable.');
    }

    // Create rate limiter (default: 60 requests per minute)
    const maxRequestsPerMinute = options?.maxRequestsPerMinute || 60;
    this.rateLimiter = new RateLimiter({
      maxRequests: maxRequestsPerMinute,
      interval: 60000 // 1 minute
    });

    // Create retry wrapper with default options
    this.retryWrapper = createRetryWrapper({
      maxRetries: 3,
      initialDelay: 1000,
      onRetry: (error, attempt) => {
        console.warn(`Retry attempt ${attempt} after error:`, error.message);
      }
    });
  }

  /**
   * Connect to the n8n API
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'X-N8N-API-KEY': this.apiKey } : {})
      },
      timeout: 30000 // 30 second timeout
    });

    try {
      // Test the connection by getting workflows with retry
      await this.retryWrapper(async () => {
        const response = await this.client!.get('/workflows');
        return response.data;
      });
      this.connected = true;
    } catch (error) {
      throw new ConnectionError(
        `Unable to connect to n8n at ${this.apiUrl}`,
        {
          apiUrl: this.apiUrl,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /**
   * Disconnect from the n8n API
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.connected = false;
  }

  /**
   * Get a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    // Skip connection check if we're calling /workflows during connect()
    if (endpoint !== '/workflows' || this.connected) {
      this.ensureConnected();
    } else if (!this.client) {
      throw new ConnectionError('Client not initialized');
    }
    
    // Apply rate limiting
    await this.rateLimiter.acquire();
    
    return this.retryWrapper(async () => {
      try {
        const response = await this.client!.get(endpoint, { params });
        return response.data;
      } catch (error: any) {
        throw this.handleApiError(error, 'GET', endpoint);
      }
    });
  }

  /**
   * Post data to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Data to post
   * @param params - Query parameters
   */
  async post(endpoint: string, data: any, params?: Record<string, any>): Promise<any> {
    this.ensureConnected();
    
    // Apply rate limiting
    await this.rateLimiter.acquire();
    
    return this.retryWrapper(async () => {
      try {
        const response = await this.client!.post(endpoint, data, { params });
        return response.data;
      } catch (error) {
        throw this.handleApiError(error, 'POST', endpoint);
      }
    });
  }

  /**
   * Put data to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Data to put
   * @param params - Query parameters
   */
  async put(endpoint: string, data: any, params?: Record<string, any>): Promise<any> {
    this.ensureConnected();
    
    // Apply rate limiting
    await this.rateLimiter.acquire();
    
    return this.retryWrapper(async () => {
      try {
        const response = await this.client!.put(endpoint, data, { params });
        return response.data;
      } catch (error: any) {
        throw this.handleApiError(error, 'PUT', endpoint);
      }
    });
  }

  /**
   * Delete a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  async delete(endpoint: string, params?: Record<string, any>): Promise<any> {
    this.ensureConnected();
    
    // Apply rate limiting
    await this.rateLimiter.acquire();
    
    return this.retryWrapper(async () => {
      try {
        const response = await this.client!.delete(endpoint, { params });
        return response.data;
      } catch (error) {
        throw this.handleApiError(error, 'DELETE', endpoint);
      }
    });
  }

  /**
   * Ensure the client is connected
   * @private
   */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new ConnectionError('Not connected to n8n API. Call connect() first.');
    }
  }

  /**
   * Handle API errors
   * @private
   */
  private handleApiError(error: any, method: string, endpoint: string): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const statusText = error.response?.statusText || 'Unknown error';
      const data = error.response?.data;
      
      let message = `${method} ${endpoint} failed`;
      
      // Extract error message from response
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else if (typeof data === 'string') {
        message = data;
      }
      
      // Store status code for retry logic
      const statusCode = status;
      
      return new ApiError(status, statusText, message, {
        method,
        endpoint,
        request: {
          headers: error.config?.headers,
          data: error.config?.data
        },
        response: data
      });
    }
    
    // Handle non-Axios errors
    return new ConnectionError(`${method} ${endpoint} failed: ${error.message}`, {
      method,
      endpoint,
      error: error.message
    });
  }
}