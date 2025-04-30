/**
 * Docker manager for n8n-tdd-framework
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { DockerContainerConfig, ContainerStatus, DockerManager } from './interfaces';

/**
 * Docker manager for n8n containers
 */
export class N8nDockerManager implements DockerManager {
  private config: DockerContainerConfig;
  private defaultDataDir: string;

  /**
   * Create a new Docker manager
   * @param config - Docker container configuration
   */
  constructor(config: DockerContainerConfig) {
    // Set default data directory
    this.defaultDataDir = path.resolve(process.cwd(), './n8n_data');

    // Set default configuration
    this.config = {
      containerName: 'n8n',
      image: 'n8nio/n8n',
      port: 5678,
      dataDir: this.defaultDataDir,
      healthCheckTimeout: 60,
      env: {},
      volumes: [],
      ...config
    };

    // Set default API URL if not provided
    if (!this.config.apiUrl) {
      this.config.apiUrl = `http://localhost:${this.config.port}/api/v1`;
    }

    // Validate required configuration
    if (!this.config.apiKey) {
      throw new Error('API key is required');
    }
  }

  /**
   * Check if n8n is running and accessible
   * @returns Promise<boolean> True if n8n is running and accessible
   */
  public async isRunning(): Promise<boolean> {
    try {
      // First try the root endpoint
      const rootUrl = this.config.apiUrl!.replace(/\/api\/v1$/, '');
      const response = await axios.get(rootUrl, {
        timeout: 2000
      });
      return response.status === 200;
    } catch (error) {
      try {
        // Then try the API endpoint
        const response = await axios.get(`${this.config.apiUrl}/healthz`, {
          timeout: 2000
        });
        return response.status === 200;
      } catch (error) {
        return false;
      }
    }
  }

  /**
   * Check if n8n container is running
   * @returns boolean True if n8n container is running
   */
  private isContainerRunning(): boolean {
    try {
      // First check for exact container name
      let result = execSync(`docker ps -q -f name=^/${this.config.containerName}$`).toString().trim();
      if (result !== '') {
        return true;
      }
      
      // Then check for any n8n container
      result = execSync(`docker ps -q -f name=n8n`).toString().trim();
      return result !== '';
    } catch (error) {
      console.error('Error checking if container is running:', (error as Error).message);
      return false;
    }
  }

  /**
   * Check if port is in use
   * @param port - Port to check
   * @returns boolean True if port is in use
   */
  private isPortInUse(port: number | string): boolean {
    try {
      const result = execSync(`docker ps --format '{{.Ports}}' | grep ${port}`).toString().trim();
      return result !== '';
    } catch (error) {
      // If command fails, port is likely not in use by Docker
      return false;
    }
  }

  /**
   * Find container using port
   * @param port - Port to check
   * @returns string|null Container name or null if not found
   */
  private findContainerUsingPort(port: number | string): string | null {
    try {
      const result = execSync(`docker ps --format '{{.Names}} {{.Ports}}' | grep ${port}`).toString().trim();
      if (result) {
        return result.split(' ')[0];
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Ensure n8n data directory exists and has correct permissions
   */
  private ensureDataDirExists(): void {
    try {
      const dataDir = this.config.dataDir!;
      
      if (!fs.existsSync(dataDir)) {
        console.log(`Creating n8n data directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Set appropriate permissions for the data directory
      console.log(`Setting permissions for n8n data directory: ${dataDir}`);
      
      // Create necessary files with proper permissions if they don't exist
      const crashJournalPath = path.join(dataDir, 'crash.journal');
      if (!fs.existsSync(crashJournalPath)) {
        fs.writeFileSync(crashJournalPath, '');
      }
      
      // Set permissions - use platform-specific commands
      if (process.platform === 'win32') {
        // Windows - permissions are handled differently
        console.log('Running on Windows - skipping explicit permission setting');
      } else {
        // Unix-like systems
        try {
          // Make the directory and its contents writable by all users
          // This is a workaround for Docker volume permission issues
          execSync(`chmod -R 777 ${dataDir}`);
          console.log('Permissions set successfully');
        } catch (permError) {
          console.warn('Warning: Could not set permissions:', (permError as Error).message);
          console.warn('The container might still work, but you might see permission errors');
        }
      }
    } catch (error) {
      throw new Error(`Error creating n8n data directory: ${(error as Error).message}`);
    }
  }

  /**
   * Start n8n container
   * @returns Promise<boolean> True if container started successfully
   */
  public async start(): Promise<boolean> {
    try {
      // Check if n8n is already running
      if (await this.isRunning()) {
        console.log('n8n is already running and accessible at ' + this.config.apiUrl);
        console.log('You can use this instance instead of starting a new one');
        return true;
      }
      
      // Check if container is running but API is not accessible
      if (this.isContainerRunning()) {
        console.log('n8n container is running but API is not accessible. Stopping and restarting...');
        await this.stop();
      }
      
      // Check if port is already in use
      if (this.isPortInUse(this.config.port!)) {
        const containerName = this.findContainerUsingPort(this.config.port!);
        throw new Error(`Port ${this.config.port} is already in use by container ${containerName || 'unknown'}`);
      }
      
      this.ensureDataDirExists();
      
      console.log('Starting n8n container...');
      
      // Build environment variables
      const envVars = {
        N8N_PORT: '5678',
        N8N_PROTOCOL: 'http',
        N8N_HOST: '0.0.0.0',
        N8N_DIAGNOSTICS_ENABLED: 'false',
        N8N_API_KEY: this.config.apiKey,
        N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
        NODE_ENV: 'production',
        ...this.config.env
      };
      
      // Build environment variable arguments
      const envArgs = Object.entries(envVars)
        .map(([key, value]) => `-e ${key}=${value}`)
        .join(' ');
      
      // Build volume mounts
      const volumeMounts = [
        `-v ${this.config.dataDir}:/home/node/.n8n`,
        ...(this.config.volumes || [])
      ].join(' ');
      
      // Start container
      execSync(`docker run -d --name ${this.config.containerName} \
        -p ${this.config.port}:5678 \
        ${envArgs} \
        ${volumeMounts} \
        --health-cmd "wget --spider http://localhost:5678/healthz || exit 1" \
        --health-interval 10s \
        --health-timeout 5s \
        --health-retries 3 \
        ${this.config.image}`);
      
      console.log('n8n container started');
      
      // Wait for container to be healthy
      return await this.waitForHealth(this.config.healthCheckTimeout);
    } catch (error) {
      console.error('Error starting n8n container:', (error as Error).message);
      return false;
    }
  }

  /**
   * Stop and remove n8n container
   * @returns Promise<boolean> True if container stopped successfully
   */
  public async stop(): Promise<boolean> {
    try {
      // Check for exact container name
      let containerName = this.config.containerName!;
      let containerExists = false;
      
      try {
        execSync(`docker inspect ${containerName}`);
        containerExists = true;
      } catch (error) {
        // Check for any n8n container
        try {
          const result = execSync(`docker ps --format '{{.Names}}' -f name=n8n`).toString().trim();
          if (result) {
            containerName = result.split('\n')[0];
            containerExists = true;
          }
        } catch (inspectError) {
          // No container found
        }
      }
      
      if (containerExists) {
        console.log(`Stopping n8n container (${containerName})...`);
        execSync(`docker stop ${containerName}`);
        console.log(`Removing n8n container (${containerName})...`);
        execSync(`docker rm ${containerName}`);
        console.log('n8n container stopped and removed');
        return true;
      } else {
        console.log('n8n container is not running');
        return true;
      }
    } catch (error) {
      console.error('Error stopping n8n container:', (error as Error).message);
      return false;
    }
  }

  /**
   * Wait for n8n to be healthy
   * @param timeout - Timeout in seconds
   * @returns Promise<boolean> True if n8n is healthy within timeout
   */
  public async waitForHealth(timeout = 60): Promise<boolean> {
    console.log(`Waiting for n8n to be healthy (timeout: ${timeout}s)...`);
    
    const startTime = Date.now();
    const timeoutMs = timeout * 1000;
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        if (await this.isRunning()) {
          console.log('n8n is healthy!');
          return true;
        }
        
        // Check container health status
        const healthStatus = execSync(`docker inspect --format='{{.State.Health.Status}}' ${this.config.containerName}`).toString().trim();
        console.log(`Container health status: ${healthStatus}`);
        
        if (healthStatus === 'unhealthy') {
          console.error('Container is unhealthy. Showing logs:');
          execSync(`docker logs ${this.config.containerName}`, { stdio: 'inherit' });
          return false;
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Continue waiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.error(`Timeout waiting for n8n to be healthy after ${timeout} seconds`);
    return false;
  }

  /**
   * Get n8n container status
   * @returns Promise<ContainerStatus> Container status
   */
  public async status(): Promise<ContainerStatus> {
    try {
      // Check for exact container name
      let containerName = this.config.containerName!;
      let containerExists = false;
      
      try {
        execSync(`docker inspect ${containerName}`);
        containerExists = true;
      } catch (error) {
        // Check for any n8n container
        try {
          const result = execSync(`docker ps --format '{{.Names}}' -f name=n8n`).toString().trim();
          if (result) {
            containerName = result.split('\n')[0];
            containerExists = true;
          }
        } catch (inspectError) {
          // No container found
        }
      }
      
      if (!containerExists) {
        return { running: false };
      }
      
      // Get container details
      const details = execSync(`docker inspect ${containerName}`).toString();
      const parsedDetails = JSON.parse(details)[0];
      
      // Check API accessibility
      const apiAccessible = await this.isRunning();
      
      return {
        running: true,
        id: parsedDetails.Id.substring(0, 12),
        name: containerName,
        created: parsedDetails.Created,
        status: parsedDetails.State.Status,
        health: parsedDetails.State.Health?.Status || 'N/A',
        image: parsedDetails.Config.Image,
        ports: `${this.config.port}:5678`,
        volumes: `${this.config.dataDir}:/home/node/.n8n`,
        apiAccessible
      };
    } catch (error) {
      console.error('Error checking n8n container status:', (error as Error).message);
      return { running: false };
    }
  }

  /**
   * Restart n8n container
   * @returns Promise<boolean> True if container restarted successfully
   */
  public async restart(): Promise<boolean> {
    try {
      await this.stop();
      return await this.start();
    } catch (error) {
      console.error('Error restarting n8n container:', (error as Error).message);
      return false;
    }
  }
}

/**
 * Create a new Docker manager
 * @param config - Docker container configuration
 * @returns DockerManager instance
 */
export function createDockerManager(config: DockerContainerConfig): DockerManager {
  return new N8nDockerManager(config);
}