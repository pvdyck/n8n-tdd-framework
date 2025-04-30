#!/usr/bin/env node

/**
 * Script to update diane to use the framework's Docker management functionality
 * and clean up the migrated code
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const dianeDir = path.resolve(__dirname, '../diane');
const dianeScriptsDir = path.resolve(dianeDir, 'scripts');
const dianeDockerManagerPath = path.resolve(dianeScriptsDir, 'docker-manager.ts');
const dianePackageJsonPath = path.resolve(dianeDir, 'package.json');

// Cleanup paths
const cleanupPaths = [
  // Add paths to files that should be removed after migration
];

console.log('Updating diane to use the framework\'s Docker management functionality...');

// Check if diane directory exists
if (!fs.existsSync(dianeDir)) {
  console.error(`Error: diane directory not found at ${dianeDir}`);
  process.exit(1);
}

// Check if docker-manager.ts exists
if (!fs.existsSync(dianeDockerManagerPath)) {
  console.error(`Error: docker-manager.ts not found at ${dianeDockerManagerPath}`);
  process.exit(1);
}

// Backup docker-manager.ts
const backupPath = `${dianeDockerManagerPath}.bak`;
console.log(`Backing up docker-manager.ts to ${backupPath}...`);
fs.copyFileSync(dianeDockerManagerPath, backupPath);

// Create a new docker-manager.ts that uses the framework
console.log('Creating new docker-manager.ts that uses the framework...');
const newDockerManagerContent = `#!/usr/bin/env ts-node

/**
 * Docker manager for n8n containers
 * This is a wrapper around the n8n-tdd-framework Docker management functionality
 */

import { createDockerManager, DockerContainerConfig } from 'n8n-tdd-framework';
import * as path from 'path';
import 'dotenv/config';

// Configuration
const config: DockerContainerConfig = {
  containerName: process.env.N8N_CONTAINER_NAME || 'n8n',
  image: process.env.N8N_IMAGE || 'n8nio/n8n',
  port: process.env.N8N_PORT || 5678,
  apiUrl: process.env.N8N_API_URL || \`http://localhost:\${process.env.N8N_PORT || 5678}/api/v1\`,
  apiKey: process.env.N8N_API_KEY || '',
  dataDir: path.resolve(__dirname, '../n8n/n8n_data'),
  healthCheckTimeout: 60
};

// Validate API key
if (!config.apiKey) {
  console.error('Error: N8N_API_KEY is not set in environment variables or .env file');
  process.exit(1);
}

// Create Docker manager
const dockerManager = createDockerManager(config);

/**
 * Main function
 */
async function main(): Promise<void> {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'start':
        console.log('Starting n8n container...');
        await dockerManager.start();
        break;
        
      case 'stop':
        console.log('Stopping n8n container...');
        await dockerManager.stop();
        break;
        
      case 'restart':
        console.log('Restarting n8n container...');
        await dockerManager.restart();
        break;
        
      case 'status':
        console.log('Getting n8n container status...');
        const status = await dockerManager.status();
        
        if (status.running) {
          console.log('n8n container is running');
          console.log(\`- ID: \${status.id}\`);
          console.log(\`- Name: \${status.name}\`);
          console.log(\`- Created: \${status.created}\`);
          console.log(\`- Status: \${status.status}\`);
          console.log(\`- Health: \${status.health}\`);
          console.log(\`- Image: \${status.image}\`);
          console.log(\`- Ports: \${status.ports}\`);
          console.log(\`- Volumes: \${status.volumes}\`);
          console.log(\`- API Accessible: \${status.apiAccessible ? 'Yes' : 'No'}\`);
        } else {
          console.log('n8n container is not running');
        }
        break;
        
      default:
        console.log('Usage: ts-node docker-manager.ts [start|stop|restart|status]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
`;

fs.writeFileSync(dianeDockerManagerPath, newDockerManagerContent);

// Update package.json to use the latest version of n8n-tdd-framework
console.log('Updating package.json...');
const packageJson = JSON.parse(fs.readFileSync(dianePackageJsonPath, 'utf8'));
packageJson.dependencies['n8n-tdd-framework'] = '^0.11.0';
fs.writeFileSync(dianePackageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('Update complete!');
console.log('');
console.log('Next steps:');
console.log('1. Run `npm install` in the diane directory to update dependencies');
console.log('2. Test the Docker management functionality with:');
console.log('   - ts-node scripts/docker-manager.ts start');
console.log('   - ts-node scripts/docker-manager.ts status');
console.log('   - ts-node scripts/docker-manager.ts stop');
console.log('');
console.log('The original docker-manager.ts has been backed up to docker-manager.ts.bak');
console.log('');

// Function to clean up migrated code
function cleanupMigratedCode() {
  console.log('Cleaning up migrated code...');
  
  // Remove coverage-related scripts
  const coverageScripts = [
    path.resolve(dianeScriptsDir, 'check-coverage-thresholds.js'),
    path.resolve(dianeScriptsDir, 'clean-coverage-files.js'),
    path.resolve(dianeScriptsDir, 'generate-coverage-index.js'),
    path.resolve(dianeScriptsDir, 'show-coverage-report.js'),
    path.resolve(dianeScriptsDir, 'update-static-dashboard.js')
  ];
  
  // Remove each script if it exists
  coverageScripts.forEach(scriptPath => {
    if (fs.existsSync(scriptPath)) {
      console.log(`Removing ${path.basename(scriptPath)}...`);
      fs.unlinkSync(scriptPath);
    }
  });
  
  // Remove backup file if cleanup is confirmed
  if (fs.existsSync(backupPath)) {
    console.log(`Removing backup file ${path.basename(backupPath)}...`);
    fs.unlinkSync(backupPath);
  }
  
  console.log('Cleanup complete!');
}

// Ask if user wants to clean up migrated code
console.log('Do you want to clean up the migrated code? (y/n)');
console.log('This will remove the original docker-manager.ts.bak file and coverage-related scripts.');
console.log('Only do this after verifying that everything is working correctly.');
console.log('');
console.log('To clean up later, run this script with the --cleanup flag:');
console.log('  node update-diane.js --cleanup');

// Check if --cleanup flag is provided
if (process.argv.includes('--cleanup')) {
  cleanupMigratedCode();
}