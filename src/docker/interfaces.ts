/**
 * Docker management interfaces for n8n-tdd-framework
 */

/**
 * Docker container configuration options
 */
export interface DockerContainerConfig {
  /**
   * Container name
   * @default 'n8n'
   */
  containerName?: string;

  /**
   * Docker image to use
   * @default 'n8nio/n8n'
   */
  image?: string;

  /**
   * Port to expose n8n on
   * @default 5678
   */
  port?: number | string;

  /**
   * API URL for n8n
   * @default 'http://localhost:{port}/api/v1'
   */
  apiUrl?: string;

  /**
   * API key for n8n
   * @required
   */
  apiKey: string;

  /**
   * Directory to mount as n8n data directory
   * @default './n8n_data'
   */
  dataDir?: string;

  /**
   * Additional environment variables to pass to the container
   */
  env?: Record<string, string>;

  /**
   * Additional volume mounts
   * Format: 'host_path:container_path'
   */
  volumes?: string[];

  /**
   * Health check timeout in seconds
   * @default 60
   */
  healthCheckTimeout?: number;
}

/**
 * Container status information
 */
export interface ContainerStatus {
  /**
   * Whether the container is running
   */
  running: boolean;

  /**
   * Container ID (if running)
   */
  id?: string;

  /**
   * Container name
   */
  name?: string;

  /**
   * Container creation time
   */
  created?: string;

  /**
   * Container status
   */
  status?: string;

  /**
   * Container health status
   */
  health?: string;

  /**
   * Container image
   */
  image?: string;

  /**
   * Exposed ports
   */
  ports?: string;

  /**
   * Mounted volumes
   */
  volumes?: string;

  /**
   * Whether the API is accessible
   */
  apiAccessible?: boolean;
}

/**
 * Docker manager interface
 */
export interface DockerManager {
  /**
   * Start n8n container
   * @returns Promise<boolean> True if container started successfully
   */
  start(): Promise<boolean>;

  /**
   * Stop and remove n8n container
   * @returns Promise<boolean> True if container stopped successfully
   */
  stop(): Promise<boolean>;

  /**
   * Restart n8n container
   * @returns Promise<boolean> True if container restarted successfully
   */
  restart(): Promise<boolean>;

  /**
   * Get n8n container status
   * @returns Promise<ContainerStatus> Container status
   */
  status(): Promise<ContainerStatus>;

  /**
   * Check if n8n is running and accessible
   * @returns Promise<boolean> True if n8n is running and accessible
   */
  isRunning(): Promise<boolean>;

  /**
   * Wait for n8n to be healthy
   * @param timeout - Timeout in seconds
   * @returns Promise<boolean> True if n8n is healthy within timeout
   */
  waitForHealth(timeout?: number): Promise<boolean>;
}