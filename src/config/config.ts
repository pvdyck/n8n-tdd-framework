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

// Cache for configuration
let cachedConfig: FrameworkConfig | null = null;

/**
 * Find configuration file in current or parent directories
 * 
 * @param startDir - Directory to start searching from
 * @returns Path to config file or null
 */
function findConfigFile(startDir: string): string | null {
  let currentDir = startDir;
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    const configPath = path.join(currentDir, 'n8n-tdd-config.json');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Load configuration from environment variables and config file
 * 
 * @param options - Configuration options
 * @returns The loaded configuration
 */
export function loadConfig(options?: FrameworkConfig): FrameworkConfig {
  // Start with default config
  let config = { ...defaultConfig };
  
  // Load from .env file if specified
  if (options?.envPath && fs.existsSync(options.envPath)) {
    dotenv.config({ path: options.envPath });
  }
  
  // Determine config file path
  let configPath: string | null = null;
  if (options?.configPath) {
    configPath = options.configPath;
  } else if (process.env.N8N_CONFIG_PATH) {
    configPath = process.env.N8N_CONFIG_PATH;
  } else {
    // Search for config file in current and parent directories
    configPath = findConfigFile(process.cwd());
  }
  
  // Load from config file if it exists
  if (configPath && fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // Only copy known configuration fields
      if (fileConfig.apiUrl !== undefined) config.apiUrl = fileConfig.apiUrl;
      if (fileConfig.apiKey !== undefined) config.apiKey = fileConfig.apiKey;
      if (fileConfig.timeout !== undefined) config.timeout = fileConfig.timeout;
      if (fileConfig.templatesDir !== undefined) config.templatesDir = fileConfig.templatesDir;
      if (fileConfig.testsDir !== undefined) config.testsDir = fileConfig.testsDir;
    } catch (error) {
      console.error(`Error loading config file: ${(error as Error).message}`);
    }
  }
  
  // Override with environment variables (env vars take precedence)
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
  
  // Override with provided options (highest priority)
  if (options) {
    // Only override defined options
    if (options.apiUrl !== undefined) config.apiUrl = options.apiUrl;
    if (options.apiKey !== undefined) config.apiKey = options.apiKey;
    if (options.timeout !== undefined) config.timeout = options.timeout;
    if (options.templatesDir !== undefined) config.templatesDir = options.templatesDir;
    if (options.testsDir !== undefined) config.testsDir = options.testsDir;
  }
  
  return config;
}

/**
 * Get the current configuration (with caching)
 * 
 * @returns The current configuration
 */
export function getConfig(): FrameworkConfig {
  // Check global cache first
  if ((global as any).__n8nTddConfig) {
    return (global as any).__n8nTddConfig;
  }
  
  // Load configuration
  const config = loadConfig();
  
  // Cache it globally
  (global as any).__n8nTddConfig = config;
  
  return config;
}

/**
 * Update the configuration
 * 
 * @param newConfig - New configuration options
 * @returns The updated configuration
 */
export function updateConfig(newConfig: Partial<FrameworkConfig>): FrameworkConfig {
  const config = getConfig();
  const updatedConfig = { ...config, ...newConfig };
  (global as any).__n8nTddConfig = updatedConfig;
  return updatedConfig;
}

/**
 * Reset the configuration to defaults
 * 
 * @returns The default configuration
 */
export function resetConfig(): FrameworkConfig {
  (global as any).__n8nTddConfig = { ...defaultConfig };
  return { ...defaultConfig };
}