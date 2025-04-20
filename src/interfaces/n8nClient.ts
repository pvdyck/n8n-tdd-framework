/**
 * Interface for n8n API client
 */
export interface N8nClient {
  /**
   * Connect to the n8n API
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from the n8n API
   */
  disconnect(): Promise<void>;
  
  /**
   * Get a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  get(endpoint: string, params?: Record<string, any>): Promise<any>;
  
  /**
   * Post data to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Data to post
   * @param params - Query parameters
   */
  post(endpoint: string, data: any, params?: Record<string, any>): Promise<any>;
  
  /**
   * Put data to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Data to put
   * @param params - Query parameters
   */
  put(endpoint: string, data: any, params?: Record<string, any>): Promise<any>;
  
  /**
   * Delete a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  delete(endpoint: string, params?: Record<string, any>): Promise<any>;
  
  /**
   * Check if the client is connected
   */
  isConnected(): boolean;
}

/**
 * Base class for n8n API clients
 */
export abstract class BaseN8nClient implements N8nClient {
  protected connected: boolean = false;
  
  /**
   * Connect to the n8n API
   */
  abstract connect(): Promise<void>;
  
  /**
   * Disconnect from the n8n API
   */
  abstract disconnect(): Promise<void>;
  
  /**
   * Get a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  abstract get(endpoint: string, params?: Record<string, any>): Promise<any>;
  
  /**
   * Post data to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Data to post
   * @param params - Query parameters
   */
  abstract post(endpoint: string, data: any, params?: Record<string, any>): Promise<any>;
  
  /**
   * Put data to the API
   * 
   * @param endpoint - API endpoint
   * @param data - Data to put
   * @param params - Query parameters
   */
  abstract put(endpoint: string, data: any, params?: Record<string, any>): Promise<any>;
  
  /**
   * Delete a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  abstract delete(endpoint: string, params?: Record<string, any>): Promise<any>;
  
  /**
   * Check if the client is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}