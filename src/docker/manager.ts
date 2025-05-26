/**
 * Docker manager for n8n-tdd-framework
 * Uses docker-compose for container management
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { DockerContainerConfig, ContainerStatus, DockerManager } from './interfaces';

/**
 * Docker manager for n8n containers using docker-compose
 */
export class N8nDockerManager implements DockerManager {
  private config: DockerContainerConfig;
  private dockerComposeFile: string;
  private serviceName = 'n8n'; // Service name from docker-compose.yml

  /**
   * Create a new Docker manager
   * @param config - Docker container configuration
   */
  constructor(config: DockerContainerConfig) {
    // Set docker-compose file path
    this.dockerComposeFile = path.resolve(process.cwd(), 'docker-compose.yml');

    // Set default configuration
    this.config = {
      containerName: 'n8n-tdd-framework',  // Match docker-compose.yml
      port: 5678,
      healthCheckTimeout: 60,
      env: {},
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
    
    // Check if docker-compose file exists
    if (!fs.existsSync(this.dockerComposeFile)) {
      throw new Error(`Docker compose file not found at ${this.dockerComposeFile}`);
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
   * Check if n8n container is running using docker-compose
   * @returns boolean True if n8n container is running
   */
  private isContainerRunning(): boolean {
    try {
      const result = execSync(
        `docker-compose -f ${this.dockerComposeFile} ps -q ${this.serviceName}`,
        { stdio: 'pipe' }
      ).toString().trim();
      return result !== '';
    } catch (error) {
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
      if (process.platform === 'win32') {
        const result = execSync(`netstat -ano | findstr :${port}`).toString();
        return result.includes('LISTENING');
      } else {
        const result = execSync(`lsof -ti:${port} 2>/dev/null || true`).toString();
        return result.trim() !== '';
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Start n8n container using docker-compose
   * @returns Promise<boolean> True if container started successfully
   */
  public async start(): Promise<boolean> {
    try {
      // Check if already running
      if (this.isContainerRunning()) {
        console.log('n8n container is already running');
        if (await this.isRunning()) {
          console.log('n8n is accessible');
          return true;
        } else {
          console.log('n8n container is running but not accessible, waiting for health...');
          return await this.waitForHealth(this.config.healthCheckTimeout);
        }
      }
      
      // Check if port is in use
      if (this.isPortInUse(this.config.port!)) {
        // Check if n8n is already running at that port
        if (await this.isRunning()) {
          console.log('n8n is already running at port', this.config.port);
          return true;
        }
        console.error(`Port ${this.config.port} is already in use by another process`);
        return false;
      }
      
      console.log('Starting n8n container with docker-compose...');
      
      // Set environment variables for docker-compose
      const env = {
        ...process.env,
        N8N_API_KEY: this.config.apiKey,
        N8N_API_ENABLED: 'true',
        ...this.config.env
      };
      
      // Start container with docker-compose
      execSync(`docker-compose -f ${this.dockerComposeFile} up -d ${this.serviceName}`, {
        env,
        stdio: 'inherit'
      });
      
      console.log('n8n container started');
      
      // Wait for container to be healthy
      return await this.waitForHealth(this.config.healthCheckTimeout);
    } catch (error) {
      console.error('Error starting n8n container:', (error as Error).message);
      return false;
    }
  }

  /**
   * Stop n8n container using docker-compose
   * @returns Promise<boolean> True if container stopped successfully
   */
  public async stop(): Promise<boolean> {
    try {
      if (this.isContainerRunning()) {
        console.log('Stopping n8n container with docker-compose...');
        execSync(`docker-compose -f ${this.dockerComposeFile} stop ${this.serviceName}`, {
          stdio: 'inherit'
        });
        console.log('n8n container stopped');
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
      } catch (error) {
        // Ignore errors during health check
      }
      
      // Wait 1 second before next check
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.error(`n8n did not become healthy within ${timeout} seconds`);
    return false;
  }

  /**
   * Restart n8n container using docker-compose
   * @returns Promise<boolean> True if container restarted successfully
   */
  public async restart(): Promise<boolean> {
    try {
      console.log('Restarting n8n container with docker-compose...');
      
      // Set environment variables for docker-compose
      const env = {
        ...process.env,
        N8N_API_KEY: this.config.apiKey,
        N8N_API_ENABLED: 'true',
        ...this.config.env
      };
      
      execSync(`docker-compose -f ${this.dockerComposeFile} restart ${this.serviceName}`, {
        env,
        stdio: 'inherit'
      });
      
      console.log('n8n container restarted');
      
      // Wait for container to be healthy
      return await this.waitForHealth(this.config.healthCheckTimeout);
    } catch (error) {
      console.error('Error restarting n8n container:', (error as Error).message);
      return false;
    }
  }

  /**
   * Get n8n container status using docker-compose
   * @returns Promise<ContainerStatus> Container status
   */
  public async status(): Promise<ContainerStatus> {
    try {
      // Default status
      const status: ContainerStatus = {
        running: false
      };
      
      // Check if container exists and get basic status
      const isRunning = this.isContainerRunning();
      
      if (isRunning) {
        status.running = true;
        
        try {
          // Get detailed container info using docker inspect
          const containerInfo = execSync(
            `docker inspect ${this.config.containerName} --format '{{json .}}'`,
            { stdio: 'pipe' }
          ).toString();
          
          const info = JSON.parse(containerInfo);
          
          status.id = info.Id?.substring(0, 12);
          status.name = info.Name?.replace(/^\//, '');
          status.created = info.Created;
          status.status = info.State?.Status;
          status.health = info.State?.Health?.Status;
          status.image = info.Config?.Image;
          
          // Get ports
          if (info.NetworkSettings?.Ports) {
            const ports = [];
            for (const [containerPort, hostBindings] of Object.entries(info.NetworkSettings.Ports)) {
              if (hostBindings && Array.isArray(hostBindings)) {
                for (const binding of hostBindings) {
                  if (binding.HostPort) {
                    ports.push(`${binding.HostPort}->${containerPort}`);
                  }
                }
              }
            }
            status.ports = ports.join(', ');
          }
          
          // Get volumes
          if (info.Mounts && Array.isArray(info.Mounts)) {
            const volumes = info.Mounts.map((mount: any) => `${mount.Source}:${mount.Destination}`).join(', ');
            status.volumes = volumes;
          }
          
          // Check API accessibility
          status.apiAccessible = await this.isRunning();
        } catch (error) {
          // If we can't get detailed info, just return basic status
          console.warn('Could not get detailed container info:', (error as Error).message);
        }
      }
      
      return status;
    } catch (error) {
      console.error('Error getting n8n container status:', (error as Error).message);
      return { running: false };
    }
  }
}

/**
 * Create a new Docker manager instance
 * @param config - Docker container configuration
 * @returns DockerManager instance
 */
export function createDockerManager(config: DockerContainerConfig): DockerManager {
  return new N8nDockerManager(config);
}