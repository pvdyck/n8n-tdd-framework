#!/usr/bin/env node

/**
 * Script to clean up migrated code from diane
 * This should only be run after verifying that everything is working correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const dianeDir = path.resolve(__dirname, '../diane');
const dianeScriptsDir = path.resolve(dianeDir, 'scripts');
const dianeUsageScriptsDir = path.resolve(dianeDir, 'usage/scripts');
const dianeDockerManagerPath = path.resolve(dianeScriptsDir, 'docker-manager.ts');
const dianePackageJsonPath = path.resolve(dianeDir, 'package.json');

console.log('Cleaning up migrated code from diane...');

// Check if diane directory exists
if (!fs.existsSync(dianeDir)) {
  console.error(`Error: diane directory not found at ${dianeDir}`);
  process.exit(1);
}

// Files to remove
const filesToRemove = [
  // Docker management
  path.resolve(dianeScriptsDir, 'docker-manager.ts.bak'),
  
  // Coverage functionality
  path.resolve(dianeScriptsDir, 'check-coverage-thresholds.js'),
  path.resolve(dianeScriptsDir, 'clean-coverage-files.js'),
  path.resolve(dianeScriptsDir, 'generate-coverage-index.js'),
  path.resolve(dianeScriptsDir, 'show-coverage-report.js'),
  path.resolve(dianeScriptsDir, 'update-static-dashboard.js'),
  
  // Usage scripts
  path.resolve(dianeUsageScriptsDir, 'generate-sample-coverage.js.bak')
];

// Remove each file if it exists
let removedCount = 0;
filesToRemove.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`Removing ${path.relative(dianeDir, filePath)}...`);
    fs.unlinkSync(filePath);
    removedCount++;
  }
});

// Clean up coverage directory
const coverageDir = path.resolve(dianeDir, 'coverage');
if (fs.existsSync(coverageDir)) {
  console.log(`Removing coverage directory...`);
  try {
    fs.rmSync(coverageDir, { recursive: true, force: true });
    removedCount++;
  } catch (error) {
    console.error(`Error removing coverage directory: ${error.message}`);
  }
}

// Clean up .github/coverage-data directory
const githubCoverageDir = path.resolve(dianeDir, '.github/coverage-data');
if (fs.existsSync(githubCoverageDir)) {
  console.log(`Removing .github/coverage-data directory...`);
  try {
    fs.rmSync(githubCoverageDir, { recursive: true, force: true });
    removedCount++;
  } catch (error) {
    console.error(`Error removing .github/coverage-data directory: ${error.message}`);
  }
}

// Clean up public directory
const publicDir = path.resolve(dianeDir, 'public');
if (fs.existsSync(publicDir)) {
  console.log(`Removing public directory...`);
  try {
    fs.rmSync(publicDir, { recursive: true, force: true });
    removedCount++;
  } catch (error) {
    console.error(`Error removing public directory: ${error.message}`);
  }
}

console.log(`Removed ${removedCount} files/directories.`);
console.log('Cleanup complete!');
console.log('');
console.log('The diane project now uses the n8n-tdd-framework for:');
console.log('1. Docker management functionality');
console.log('2. Coverage tracking and reporting');
console.log('');
console.log('To verify everything is working:');
console.log('1. Run `npm install` in the diane directory');
console.log('2. Test Docker management: `ts-node scripts/docker-manager.ts status`');
console.log('3. Test coverage functionality: `npm run coverage:check`');