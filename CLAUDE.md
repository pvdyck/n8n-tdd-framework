# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript (outputs to `dist/`)
- `npm run clean` - Remove dist directory
- `npm run prepare` - Automatically runs build (triggered on npm install)

### Testing
- `npm test` - Run all tests using Jest
- `npm run test:coverage` - Run tests with coverage report
- Run a single test: `npx jest tests/specific-test.test.ts`

### Code Quality
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run lint:fix` - Run ESLint and automatically fix issues

### Documentation
- `npm run docs` - Generate TypeDoc API documentation (outputs to `docs/api`)

### Publishing
- `npm version patch/minor/major` - Bump version, build, and create git tag
- `npm publish` - Publish to npm (runs tests first via prepublishOnly)

## High-Level Architecture

This is a Test-Driven Development framework for n8n workflows. The codebase is organized into several key modules:

### Core Components

1. **WorkflowManager** (`src/workflows/manager.ts`) - Central class for managing n8n workflows and credentials. Handles all API interactions with n8n, including:
   - CRUD operations for workflows
   - Credential management with environment variable support
   - Template-based workflow creation
   - Import/export functionality

2. **N8nClient** (`src/clients/realN8nClient.ts`) - Low-level HTTP client that interfaces with the n8n API. All API calls go through this client.

3. **DeclarativeTestRunner** (`src/workflows/testing/declarative/runner.ts`) - Enables JSON-based declarative testing of workflows. Tests can be defined in JSON files with assertions.

4. **DockerManager** (`src/docker/manager.ts`) - Manages n8n Docker containers for isolated testing environments.

### Key Design Patterns

- **Environment Variable Security**: All credentials are managed through environment variables with the prefix `N8N_CREDENTIAL_<NAME>_<PROPERTY>`. The framework automatically resolves `${VAR_NAME}` references in credential data.

- **Template System**: Workflows can be saved as templates and instantiated with different parameters. Templates are stored in the configured `templatesDir`.

- **Declarative Testing**: Tests are defined as JSON files that specify workflows to create, credentials to use, inputs to provide, and assertions to validate.

- **Coverage Reporting**: Coverage tracking is planned for future releases.

### CLI Architecture

The framework includes a CLI (`bin/n8n-tdd.js`) that provides commands for:
- Workflow management (list, create, execute)
- Test execution
- Docker container management

### Configuration Hierarchy

Configuration is resolved in this order:
1. Constructor options (highest priority)
2. Configuration file (`n8n-tdd-config.json`)
3. Environment variables
4. Default values (lowest priority)

### Testing Infrastructure

The framework uses Jest for testing with:
- TypeScript support via ts-jest
- Coverage thresholds set at 70% for all metrics
- Test files located in `tests/` directory
- Mocks excluded from coverage

### Key Exports

The framework exports the following main components via `src/index.ts`:
- WorkflowManager and N8nClient for workflow management
- DeclarativeTestRunner and related types for testing
- Docker management utilities
- Configuration and credential utilities
- CLI functionality