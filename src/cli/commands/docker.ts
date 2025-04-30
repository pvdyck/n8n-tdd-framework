/**
 * Docker CLI commands for n8n-tdd-framework
 */

import { createDockerManager, DockerContainerConfig } from '../../docker';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Parse Docker CLI arguments
 * @param args - CLI arguments
 * @returns Docker container configuration
 */
export function parseDockerArgs(args: string[]): DockerContainerConfig {
  // Default configuration
  const config: DockerContainerConfig = {
    apiKey: process.env.N8N_API_KEY || '',
    containerName: process.env.N8N_CONTAINER_NAME || 'n8n',
    image: process.env.N8N_IMAGE || 'n8nio/n8n',
    port: process.env.N8N_PORT || 5678,
    dataDir: path.resolve(process.cwd(), './n8n_data'),
    healthCheckTimeout: 60,
    env: {},
    volumes: []
  };

  // Parse arguments
  args.forEach(arg => {
    if (arg.startsWith('--api-key=')) {
      config.apiKey = arg.split('=')[1];
    } else if (arg.startsWith('--container-name=')) {
      config.containerName = arg.split('=')[1];
    } else if (arg.startsWith('--image=')) {
      config.image = arg.split('=')[1];
    } else if (arg.startsWith('--port=')) {
      config.port = arg.split('=')[1];
    } else if (arg.startsWith('--data-dir=')) {
      config.dataDir = path.resolve(process.cwd(), arg.split('=')[1]);
    } else if (arg.startsWith('--timeout=')) {
      config.healthCheckTimeout = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--env=')) {
      const envPair = arg.split('=')[1];
      const [key, value] = envPair.split(':');
      if (key && value && config.env) {
        config.env[key] = value;
      }
    } else if (arg.startsWith('--volume=')) {
      const volume = arg.split('=')[1];
      if (volume && config.volumes) {
        config.volumes.push(volume);
      }
    }
  });

  // Validate API key
  if (!config.apiKey) {
    throw new Error('API key is required. Set N8N_API_KEY environment variable or use --api-key=<key>');
  }

  return config;
}

/**
 * Start n8n Docker container
 * @param args - CLI arguments
 */
export async function startContainer(args: string[]): Promise<void> {
  try {
    const config = parseDockerArgs(args);
    const dockerManager = createDockerManager(config);
    
    console.log('Starting n8n container...');
    const result = await dockerManager.start();
    
    if (result) {
      console.log('n8n container started successfully');
      console.log(`API URL: http://localhost:${config.port}/`);
    } else {
      console.error('Failed to start n8n container');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error starting n8n container: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Stop n8n Docker container
 * @param args - CLI arguments
 */
export async function stopContainer(args: string[]): Promise<void> {
  try {
    const config = parseDockerArgs(args);
    const dockerManager = createDockerManager(config);
    
    console.log('Stopping n8n container...');
    const result = await dockerManager.stop();
    
    if (result) {
      console.log('n8n container stopped successfully');
    } else {
      console.error('Failed to stop n8n container');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error stopping n8n container: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Restart n8n Docker container
 * @param args - CLI arguments
 */
export async function restartContainer(args: string[]): Promise<void> {
  try {
    const config = parseDockerArgs(args);
    const dockerManager = createDockerManager(config);
    
    console.log('Restarting n8n container...');
    const result = await dockerManager.restart();
    
    if (result) {
      console.log('n8n container restarted successfully');
      console.log(`API URL: http://localhost:${config.port}/`);
    } else {
      console.error('Failed to restart n8n container');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error restarting n8n container: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Get n8n Docker container status
 * @param args - CLI arguments
 */
export async function containerStatus(args: string[]): Promise<void> {
  try {
    const config = parseDockerArgs(args);
    const dockerManager = createDockerManager(config);
    
    console.log('Getting n8n container status...');
    const status = await dockerManager.status();
    
    if (status.running) {
      console.log('n8n container is running');
      console.log(`- ID: ${status.id}`);
      console.log(`- Name: ${status.name}`);
      console.log(`- Created: ${status.created}`);
      console.log(`- Status: ${status.status}`);
      console.log(`- Health: ${status.health}`);
      console.log(`- Image: ${status.image}`);
      console.log(`- Ports: ${status.ports}`);
      console.log(`- Volumes: ${status.volumes}`);
      console.log(`- API Accessible: ${status.apiAccessible ? 'Yes' : 'No'}`);
      console.log(`- API URL: http://localhost:${config.port}/`);
    } else {
      console.log('n8n container is not running');
    }
  } catch (error) {
    console.error(`Error getting n8n container status: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Show Docker CLI help
 */
export function showDockerHelp(): void {
  console.log('n8n Docker Manager CLI');
  console.log('---------------------');
  console.log('');
  console.log('Available commands:');
  console.log('  docker:start    Start n8n Docker container');
  console.log('  docker:stop     Stop n8n Docker container');
  console.log('  docker:restart  Restart n8n Docker container');
  console.log('  docker:status   Get n8n Docker container status');
  console.log('');
  console.log('Options:');
  console.log('  --api-key=<key>           n8n API key (required if N8N_API_KEY not set)');
  console.log('  --container-name=<name>   Container name (default: n8n)');
  console.log('  --image=<image>           Docker image (default: n8nio/n8n)');
  console.log('  --port=<port>             Port to expose n8n on (default: 5678)');
  console.log('  --data-dir=<dir>          Directory to mount as n8n data directory (default: ./n8n_data)');
  console.log('  --timeout=<seconds>       Health check timeout in seconds (default: 60)');
  console.log('  --env=<key:value>         Additional environment variable (can be used multiple times)');
  console.log('  --volume=<host:container> Additional volume mount (can be used multiple times)');
  console.log('');
  console.log('Examples:');
  console.log('  n8n-tdd docker:start --api-key=1234567890 --port=5678');
  console.log('  n8n-tdd docker:stop');
  console.log('  n8n-tdd docker:restart --container-name=my-n8n');
  console.log('  n8n-tdd docker:status');
}