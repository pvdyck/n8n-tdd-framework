import axios, { AxiosInstance } from 'axios';
import { BaseN8nClient } from '../interfaces/n8nClient';
import { loadConfig } from '../config/config';

/**
 * Real implementation of the N8nClient interface that connects to an actual n8n instance
 */
export default class RealN8nClient extends BaseN8nClient {
  private client: AxiosInstance | null = null;
  private apiUrl: string;
  private apiKey: string;

  /**
   * Create a new RealN8nClient
   * 
   * @param options - Client options
   */
  constructor(options?: { apiUrl?: string; apiKey?: string }) {
    super();
    
    const config = loadConfig();
    
    this.apiUrl = options?.apiUrl || config.apiUrl || process.env.N8N_API_URL || 'http://localhost:5678/api/v1';
    this.apiKey = options?.apiKey || config.apiKey || process.env.N8N_API_KEY || '';
    
    if (!this.apiUrl) {
      throw new Error('N8N API URL is required. Set it in the options, config file, or N8N_API_URL environment variable.');
    }
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
      }
    });

    try {
      // Test the connection by getting the health status
      await this.get('/health');
      this.connected = true;
    } catch (error) {
      throw new Error(`Failed to connect to n8n API: ${(error as Error).message}`);
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
    this.ensureConnected();
    
    try {
      const response = await this.client!.get(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `GET ${endpoint}`);
    }
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
    
    try {
      const response = await this.client!.post(endpoint, data, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `POST ${endpoint}`);
    }
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
    
    try {
      const response = await this.client!.put(endpoint, data, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `PUT ${endpoint}`);
    }
  }

  /**
   * Delete a resource from the API
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  async delete(endpoint: string, params?: Record<string, any>): Promise<any> {
    this.ensureConnected();
    
    try {
      const response = await this.client!.delete(endpoint, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error, `DELETE ${endpoint}`);
    }
  }

  /**
   * Ensure the client is connected
   * @private
   */
  private ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new Error('Not connected to n8n API. Call connect() first.');
    }
  }

  /**
   * Handle API errors
   * @private
   */
  private handleApiError(error: any, operation: string): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
      throw new Error(`${operation} failed: ${status} - ${message}`);
    }
    
    throw new Error(`${operation} failed: ${(error as Error).message}`);
  }
}