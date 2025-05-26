import { createDockerManager } from 'n8n-tdd-framework';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env') });

export default async function globalSetup() {
  console.log('\n🚀 Starting n8n container for integration tests...\n');
  
  const dockerManager = createDockerManager({
    apiKey: process.env.N8N_API_KEY || 'test-integration-key',
    port: process.env.N8N_PORT || 5678,
    healthCheckTimeout: 60
  });
  
  try {
    // Start the container
    const started = await dockerManager.start();
    if (!started) {
      throw new Error('Failed to start n8n container');
    }
    
    console.log('✅ n8n container started successfully');
    console.log(`📡 API available at: http://localhost:${process.env.N8N_PORT || 5678}\n`);
    
    // Store reference for teardown
    (global as any).__DOCKER_MANAGER__ = dockerManager;
  } catch (error) {
    console.error('❌ Failed to start n8n container:', error);
    throw error;
  }
}