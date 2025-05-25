# n8n-tdd-framework Implementation Guide

> **Status**: Historical Migration Document
> 
> This document was used during the initial migration from the "diane" project to the n8n-tdd-framework.
> The migration has been completed and this document is kept for historical reference only.

This guide provides the specific npm commands and steps needed to package the n8n TDD framework for use in other projects.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- An npm account (for publishing)

## Step 1: Create a New Package Directory

```bash
# Create a new directory for the package
mkdir n8n-tdd-framework
cd n8n-tdd-framework

# Initialize git repository
git init

# Initialize npm package with default values (you can edit the package.json later)
npm init -y
```

## Step 2: Set Up the Package Structure

```bash
# Create directory structure
mkdir -p src/clients src/config src/interfaces src/testing src/utils src/workflows
mkdir -p src/workflows/testing/declarative
mkdir -p dist docs examples
```

## Step 3: Copy Relevant Files from the Original Framework

```bash
# Copy core framework files (adjust paths as needed)
cp -r ../diane/framework/src/clients/realN8nClient.ts src/clients/
cp -r ../diane/framework/src/config/config.ts src/config/
cp -r ../diane/framework/src/interfaces/n8nClient.ts src/interfaces/
cp -r ../diane/framework/src/testing/types.ts src/testing/
cp -r ../diane/framework/src/testing/errors.ts src/testing/
cp -r ../diane/framework/src/testing/retry.ts src/testing/
cp -r ../diane/framework/src/testing/testResourceManager.ts src/testing/
cp -r ../diane/framework/src/testing/testRunner.ts src/testing/
cp -r ../diane/framework/src/testing/validation.ts src/testing/

# Copy declarative testing files
cp -r ../diane/framework/src/workflows/testing/declarative/runner.ts src/workflows/testing/declarative/
cp -r ../diane/framework/src/workflows/testing/declarative/testCreator.ts src/workflows/testing/declarative/
cp -r ../diane/framework/src/workflows/testing/declarative/types.ts src/workflows/testing/declarative/
cp -r ../diane/framework/src/workflows/testing/declarative/validator.ts src/workflows/testing/declarative/
cp -r ../diane/framework/src/workflows/testing/declarative/schemas src/workflows/testing/declarative/

# Copy workflow management files
cp -r ../diane/framework/src/workflows/cli.ts src/workflows/
cp -r ../diane/framework/src/workflows/manager.ts src/workflows/

# Copy utility files
cp -r ../diane/framework/src/utils/n8nClient.ts src/utils/
```

## Step 4: Configure Package Files

### Update package.json

```bash
# Install required dependencies
npm install --save ajv ajv-formats axios dotenv

# Install development dependencies
npm install --save-dev typescript rimraf @types/node @types/jest jest ts-jest @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint eslint-plugin-unused-imports ts-node
```

Edit the package.json file to match the following structure:

```json
{
  "name": "n8n-tdd-framework",
  "version": "0.9.0",
  "description": "A Test-Driven Development framework for n8n workflows",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepare": "npm run build",
    "test": "jest --config jest.config.js",
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "prepublishOnly": "npm run lint && npm test"
  },
  "keywords": [
    "n8n",
    "workflow",
    "automation",
    "testing",
    "tdd"
  ],
  "author": "",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/n8n-tdd-framework"
  },
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "axios": "^1.8.4",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@typescript-eslint/eslint-plugin": "^8.29.1",
    "@typescript-eslint/parser": "^8.29.1",
    "eslint": "^9.24.0",
    "eslint-plugin-unused-imports": "^4.1.4",
    "jest": "^29.7.0",
    "rimraf": "^5.0.0",
    "ts-jest": "^29.3.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.2"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### Create tsconfig.json

Create a tsconfig.json file with the following content:

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "src/testing/mocks/**/*"]
}
```

### Create .npmignore

Create a .npmignore file with the following content:

```
# Source
src/
tests/

# Configuration
tsconfig.json
jest.config.js
.eslintrc.js

# Development
coverage/
.github/
.vscode/

# Logs
*.log
npm-debug.log*

# Misc
.DS_Store
```

### Create jest.config.js

Create a jest.config.js file with the following content:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/testing/mocks/**/*.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

## Step 5: Create Entry Point

Create src/index.ts with the following content:

```typescript
// Core exports
export { default as WorkflowManager } from './workflows/manager';
export { default as N8nClient } from './clients/realN8nClient';

// Interfaces
export * from './interfaces/n8nClient';
export * from './testing/types';

// Declarative testing
export * from './workflows/testing/declarative/runner';
export * from './workflows/testing/declarative/testCreator';
export * from './workflows/testing/declarative/types';
export * from './workflows/testing/declarative/validator';

// Utilities
export * from './utils/n8nClient';
export * from './config/config';

// CLI exports
export { default as WorkflowCLI } from './workflows/cli';
```

## Step 6: Create Documentation

### Create README.md

Create a README.md file with the following content:

```markdown
# n8n-tdd-framework

A Test-Driven Development framework for n8n workflows.

## Installation

```bash
npm install n8n-tdd-framework
```

## Features

- Create, read, update, and delete n8n workflows
- Import and export workflows to/from files
- Template-based workflow creation
- Declarative workflow testing
- CI/CD integration

## Usage

### Basic Usage

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';

// Create a workflow manager
const manager = new WorkflowManager();

// List all workflows
const workflows = await manager.listWorkflows();
console.log(`Found ${workflows.length} workflow(s)`);
```

### Declarative Testing

```typescript
import { DeclarativeTestRunner } from 'n8n-tdd-framework';

// Create a test runner
const runner = new DeclarativeTestRunner();

// Run tests from a file
const results = await runner.runTestsFromFile('path/to/tests.json');
console.log(`Tests: ${results.passed}/${results.total} passed`);
```

## Documentation

For detailed documentation, see the [docs](./docs) directory.

## License

ISC
```

### Create API Documentation

```bash
# Install TypeDoc
npm install --save-dev typedoc

# Add script to package.json
# "docs": "typedoc --out docs/api src/index.ts"

# Generate API documentation
npm run docs
```

## Step 7: Create Example Projects

### Basic Usage Example

Create examples/basic-usage/package.json:

```json
{
  "name": "n8n-tdd-framework-basic-example",
  "version": "1.0.0",
  "description": "Basic example of using n8n-tdd-framework",
  "main": "index.js",
  "scripts": {
    "start": "ts-node index.ts"
  },
  "dependencies": {
    "n8n-tdd-framework": "^0.9.0",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.8.2"
  }
}
```

Create examples/basic-usage/index.ts:

```typescript
import { WorkflowManager } from 'n8n-tdd-framework';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Create a workflow manager
    const manager = new WorkflowManager();
    
    // Connect to n8n
    await manager.connect();
    
    // List all workflows
    const workflows = await manager.listWorkflows();
    console.log(`Found ${workflows.length} workflow(s):`);
    
    workflows.forEach(workflow => {
      console.log(`- ${workflow.name} (ID: ${workflow.id})`);
    });
    
    // Disconnect
    await manager.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Declarative Testing Example

Create examples/declarative-testing/package.json:

```json
{
  "name": "n8n-tdd-framework-testing-example",
  "version": "1.0.0",
  "description": "Testing example of using n8n-tdd-framework",
  "main": "index.js",
  "scripts": {
    "test": "ts-node index.ts"
  },
  "dependencies": {
    "n8n-tdd-framework": "^0.9.0",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.8.2"
  }
}
```

Create examples/declarative-testing/tests/example-test.json:

```json
[
  {
    "name": "Simple HTTP Workflow Test",
    "workflows": [
      {
        "templateName": "simple_http_workflow",
        "name": "Test HTTP Workflow",
        "isPrimary": true
      }
    ],
    "assertions": [
      {
        "description": "Response should be successful",
        "assertion": "result && result.success === true"
      },
      {
        "description": "Response should contain data",
        "assertion": "result && result.data && typeof result.data === 'object'"
      }
    ]
  }
]
```

Create examples/declarative-testing/index.ts:

```typescript
import { DeclarativeTestRunner } from 'n8n-tdd-framework';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runTests() {
  try {
    // Create a test runner
    const runner = new DeclarativeTestRunner();
    
    // Run tests from a file
    const testFile = path.resolve(__dirname, 'tests/example-test.json');
    const results = await runner.runTestsFromFile(testFile);
    
    // Print results
    console.log(`Tests: ${results.passed}/${results.total} passed`);
    
    if (results.failed > 0) {
      console.log('\nFailed tests:');
      results.failures.forEach(failure => {
        console.log(`- ${failure.testName}: ${failure.message}`);
      });
    }
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

runTests();
```

## Step 8: Build and Test the Package

```bash
# Build the package
npm run build

# Create a tarball
npm pack
```

This will create a file named `n8n-tdd-framework-0.9.0.tgz` that can be installed in other projects.

## Step 9: Test in a Separate Project

```bash
# Create a test project
mkdir test-project
cd test-project

# Initialize the project
npm init -y

# Install the packaged framework
npm install ../n8n-tdd-framework-0.9.0.tgz

# Create a test script
echo "const { WorkflowManager } = require('n8n-tdd-framework'); console.log('Successfully imported n8n-tdd-framework');" > test.js

# Run the test script
node test.js
```

## Step 10: Publish to npm

```bash
# Login to npm
npm login

# Publish the package
npm publish
```

## Step 11: Set Up Continuous Integration

Create a .github/workflows/ci.yml file:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [14.x, 16.x, 18.x]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: npm run build
    - run: npm test

  publish:
    needs: build
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16.x'
        registry-url: 'https://registry.npmjs.org'
    - run: npm ci
    - run: npm run build
    - run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Step 12: Create a CHANGELOG.md

Create a CHANGELOG.md file:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2025-04-20

### Added
- Initial release of the n8n-tdd-framework
- Core workflow management functionality
- Declarative testing framework
- CLI tools for workflow management
```

## Step 13: Update Existing Projects to Use the Package

To update existing projects that use the framework locally:

1. Remove the local reference to the framework:
```json
"dependencies": {
  "n8n-workflow-framework": "file:../framework",
  ...
}
```

2. Add the npm package:
```bash
npm install n8n-tdd-framework
```

3. Update import statements:
```typescript
// Before
import { WorkflowManager } from 'n8n-workflow-framework';

// After
import { WorkflowManager } from 'n8n-tdd-framework';
```

## Maintenance and Updates

### Releasing a New Version

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Build the package
npm run build

# Publish the package
npm publish
```

### Creating a GitHub Release

```bash
# Create a tag
git tag v0.9.0

# Push the tag
git push origin v0.9.0
```

Then create a release on GitHub with release notes.