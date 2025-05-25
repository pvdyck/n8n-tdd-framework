# n8n-tdd-framework Package Structure

This document describes the current structure and configuration of the n8n-tdd-framework npm package.

## Package Structure

```
n8n-tdd-framework/
├── src/                    # Source code
│   ├── clients/           # n8n API clients
│   ├── config/            # Configuration management
│   ├── docker/            # Docker management
│   ├── interfaces/        # TypeScript interfaces
│   ├── testing/           # Testing types and utilities
│   ├── utils/             # Utility functions
│   ├── workflows/         # Workflow management
│   │   ├── testing/       # Declarative testing
│   │   │   └── declarative/
│   │   ├── cli.ts        # CLI functionality
│   │   └── manager.ts    # WorkflowManager class
│   └── index.ts          # Main exports
├── bin/                   # CLI executable
│   └── n8n-tdd.js
├── dist/                  # Compiled output (generated)
├── docs/                  # Documentation
├── examples/              # Usage examples
├── tests/                 # Test files
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # Main documentation

```

## Key Components

### 1. WorkflowManager
The main class for managing n8n workflows, providing methods for:
- CRUD operations on workflows
- Credential management
- Template management
- Import/export functionality

### 2. DeclarativeTestRunner
Enables JSON-based testing of workflows with:
- Test case validation
- Workflow execution
- Assertion evaluation
- Result reporting

### 3. DockerManager
Manages n8n Docker containers:
- Container lifecycle management
- Health checks
- Configuration management

### 4. CLI Tool
Command-line interface for:
- Workflow operations
- Test execution
- Docker management

## Package Configuration

### package.json
- **Name**: n8n-tdd-framework
- **Version**: 0.13.0
- **Main**: dist/index.js
- **Types**: dist/index.d.ts
- **CLI**: bin/n8n-tdd.js

### Build Process
- TypeScript compilation to JavaScript
- Type declaration generation
- Clean build directory before compilation

### Testing
- Jest for unit testing
- 70% coverage thresholds
- TypeScript support via ts-jest

## Publishing

The package is configured for npm publishing with:
- Pre-publish testing
- Version management scripts
- Automated git tagging

## Usage

After installation via `npm install n8n-tdd-framework`, users can:
- Import classes and functions for programmatic use
- Use the CLI tool for command-line operations
- Run declarative tests from JSON files