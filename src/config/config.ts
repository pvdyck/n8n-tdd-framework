import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Configuration options for the framework
 */
export interface FrameworkConfig {
  /**
   * n8n API URL
   */
  apiUrl?: string;
  
  /**
   * n8n API key
   */
  apiKey?: string;
  
  /**
   * Path to the .env file
   */
  envPath?: string;
  
  /**
   * Path to the config file
   */
  configPath?: string;
  
  /**
   * Timeout for API requests in milliseconds
   */
  timeout?: number;
  
  /**
   * Base directory for workflow templates
   */
  templatesDir?: string;
  
  /**
   * Base directory for test files
   */
  testsDir?: string;
}

// Default configuration
const defaultConfig: FrameworkConfig = {
  apiUrl: 'http://localhost:5678/api/v1',
  timeout: 30000,
  templatesDir: './templates',
  testsDir: './tests'
};

// Global configuration instance
let config: FrameworkConfig = { ...defaultConfig };

/**
 * Load configuration from environment variables and config file
 * 
 * @param options - Configuration options
 * @returns The loaded configuration
 */
export function loadConfig(options?: FrameworkConfig): FrameworkConfig {
  // Start with default config
  config = { ...defaultConfig };
  
  // Load from .env file if it exists
  const envPath = options?.envPath || path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  
  // Load from environment variables
  if (process.env.N8N_API_URL) {
    config.apiUrl = process.env.N8N_API_URL;
  }
  
  if (process.env.N8N_API_KEY) {
    config.apiKey = process.env.N8N_API_KEY;
  }
  
  if (process.env.N8N_TIMEOUT) {
    config.timeout = parseInt(process.env.N8N_TIMEOUT, 10);
  }
  
  if (process.env.N8N_TEMPLATES_DIR) {
    config.templatesDir = process.env.N8N_TEMPLATES_DIR;
  }
  
  if (process.env.N8N_TESTS_DIR) {
    config.testsDir = process.env.N8N_TESTS_DIR;
  }
  
  // Load from config file if it exists
  const configPath = options?.configPath || path.resolve(process.cwd(), 'n8n-tdd-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...fileConfig };
    } catch (error) {
      console.error(`Error loading config file: ${(error as Error).message}`);
    }
  }
  
  // Override with provided options
  if (options) {
    config = { ...config, ...options };
  }
  
  return config;
}

/**
 * Get the current configuration
 * 
 * @returns The current configuration
 */
export function getConfig(): FrameworkConfig {
  return { ...config };
}

/**
 * Update the configuration
 * 
 * @param newConfig - New configuration options
 * @returns The updated configuration
 */
export function updateConfig(newConfig: Partial<FrameworkConfig>): FrameworkConfig {
  config = { ...config, ...newConfig };
  return { ...config };
}

/**
 * Reset the configuration to defaults
 * 
 * @returns The default configuration
 */
export function resetConfig(): FrameworkConfig {
  config = { ...defaultConfig };
  return { ...config };
}