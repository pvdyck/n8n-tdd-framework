# Migration Plan: Moving Functionality from diane to n8n-tdd-framework

## Overview

This document outlines the plan to migrate all functionality from the diane project to the n8n-tdd-framework, leaving diane with only test data and test scenarios. This migration will enhance the framework's capabilities and simplify the diane project.

## Components to Migrate

### 1. Docker Management
- **Source**: `scripts/docker-manager.ts`
- **Target**: `src/docker/manager.ts`
- **Description**: Manages n8n Docker containers for testing

### 2. Test Runner Components
- **Source**: 
  - `usage/scripts/runDeclarativeTests.ts`
  - `usage/scripts/run-tests-direct.js`
- **Target**: 
  - `src/testing/runners/declarativeRunner.ts`
  - `src/testing/runners/directRunner.ts`
- **Description**: Enhanced test runners for declarative and direct testing

### 3. CI/CD Integration
- **Source**: `scripts/ci-test.ts`
- **Target**: `src/ci/runner.ts`
- **Description**: CI testing functionality for standardized CI/CD integration

### 4. Test Utilities
- **Source**: 
  - `scripts/analyze-test-failures.js`
  - `scripts/combine-test-reports.js`
  - `scripts/run-tests-chunk.js`
- **Target**: 
  - `src/testing/utils/failureAnalyzer.ts`
  - `src/testing/utils/reportCombiner.ts`
  - `src/testing/utils/chunkRunner.ts`
- **Description**: Utilities for test analysis, reporting, and execution

### 5. Workflow Management
- **Source**: 
  - `scripts/workflow.ts`
  - `scripts/client.ts`
  - `usage/scripts/createWorkflow.ts`
  - `usage/scripts/deleteWorkflow.ts`
- **Target**: 
  - `src/workflows/manager.ts` (enhanced)
  - `src/clients/n8nClient.ts` (enhanced)
  - `src/workflows/utils/creator.ts`
  - `src/workflows/utils/remover.ts`
- **Description**: Enhanced workflow management functionality

### 6. Initialization Scripts
- **Source**: `usage/scripts/init-coverage.js`
- **Target**: `src/testing/coverage/utils/initializer.ts`
- **Description**: Scripts for initializing coverage directory structure

## Migration Phases

### Phase 1: Docker Management
1. Create Docker management module in the framework
2. Migrate docker-manager.ts functionality
3. Update diane to use the framework's Docker management
4. Test functionality

### Phase 2: Test Runner Components
1. Enhance the framework's test runner components
2. Migrate runDeclarativeTests.ts and run-tests-direct.js functionality
3. Update diane to use the framework's test runners
4. Test functionality

### Phase 3: CI/CD Integration
1. Create CI/CD integration module in the framework
2. Migrate ci-test.ts functionality
3. Update diane to use the framework's CI/CD integration
4. Test functionality

### Phase 4: Test Utilities
1. Create test utilities module in the framework
2. Migrate test utility scripts
3. Update diane to use the framework's test utilities
4. Test functionality

### Phase 5: Workflow Management
1. Enhance the framework's workflow management components
2. Migrate workflow management scripts
3. Update diane to use the framework's workflow management
4. Test functionality

### Phase 6: Initialization Scripts
1. Enhance the framework's initialization capabilities
2. Migrate initialization scripts
3. Update diane to use the framework's initialization
4. Test functionality

## Implementation Details

### Phase 1: Docker Management

#### 1.1 Create Docker Management Module
- Create directory structure: `src/docker/`
- Create base interfaces: `src/docker/interfaces.ts`

#### 1.2 Migrate Docker Manager
- Create `src/docker/manager.ts` based on diane's `scripts/docker-manager.ts`
- Generalize functionality to work with different configurations
- Add comprehensive error handling
- Add documentation

#### 1.3 Update CLI
- Add Docker management commands to the CLI
- Create command handlers in `src/cli/commands/docker.ts`

#### 1.4 Update diane
- Remove `scripts/docker-manager.ts`
- Update package.json scripts to use the framework's Docker management

### Phase 2: Test Runner Components

#### 2.1 Enhance Test Runner Components
- Analyze existing test runners in the framework
- Identify enhancements from diane's test runners

#### 2.2 Migrate Test Runners
- Enhance `src/testing/runners/` with functionality from diane's test runners
- Ensure backward compatibility
- Add new features from diane's test runners

#### 2.3 Update diane
- Remove `usage/scripts/runDeclarativeTests.ts` and `usage/scripts/run-tests-direct.js`
- Update package.json scripts to use the framework's test runners

### Phase 3: CI/CD Integration

#### 3.1 Create CI/CD Integration Module
- Create directory structure: `src/ci/`
- Create base interfaces: `src/ci/interfaces.ts`

#### 3.2 Migrate CI Test Functionality
- Create `src/ci/runner.ts` based on diane's `scripts/ci-test.ts`
- Generalize functionality to work with different CI environments
- Add comprehensive error handling
- Add documentation

#### 3.3 Update CLI
- Add CI/CD commands to the CLI
- Create command handlers in `src/cli/commands/ci.ts`

#### 3.4 Update diane
- Remove `scripts/ci-test.ts`
- Update package.json scripts to use the framework's CI/CD integration

### Phase 4: Test Utilities

#### 4.1 Create Test Utilities Module
- Create directory structure: `src/testing/utils/`
- Create base interfaces: `src/testing/utils/interfaces.ts`

#### 4.2 Migrate Test Utilities
- Create utility modules based on diane's test utility scripts
- Generalize functionality
- Add comprehensive error handling
- Add documentation

#### 4.3 Update diane
- Remove test utility scripts
- Update package.json scripts to use the framework's test utilities

### Phase 5: Workflow Management

#### 5.1 Enhance Workflow Management Components
- Analyze existing workflow management in the framework
- Identify enhancements from diane's workflow management

#### 5.2 Migrate Workflow Management
- Enhance `src/workflows/` with functionality from diane's workflow management
- Ensure backward compatibility
- Add new features from diane's workflow management

#### 5.3 Update diane
- Remove workflow management scripts
- Update package.json scripts to use the framework's workflow management

### Phase 6: Initialization Scripts

#### 6.1 Enhance Initialization Capabilities
- Analyze existing initialization in the framework
- Identify enhancements from diane's initialization scripts

#### 6.2 Migrate Initialization Scripts
- Enhance `src/testing/coverage/utils/` with functionality from diane's initialization scripts
- Ensure backward compatibility
- Add new features from diane's initialization scripts

#### 6.3 Update diane
- Remove initialization scripts
- Update package.json scripts to use the framework's initialization

## Final State

### n8n-tdd-framework
- Enhanced with all functionality from diane
- Comprehensive documentation
- Improved test coverage
- Standardized interfaces

### diane
- Contains only test data and test scenarios
- Uses n8n-tdd-framework for all functionality
- Simplified structure
- Easier to maintain

## Timeline

- **Phase 1**: 1 week
- **Phase 2**: 1 week
- **Phase 3**: 1 week
- **Phase 4**: 1 week
- **Phase 5**: 1 week
- **Phase 6**: 1 week

Total estimated time: 6 weeks

## Risks and Mitigations

### Risks
1. **Breaking Changes**: Migration might introduce breaking changes
2. **Compatibility Issues**: Framework might not work with all use cases
3. **Documentation Gaps**: Insufficient documentation might hinder adoption
4. **Testing Coverage**: Insufficient testing might lead to bugs

### Mitigations
1. **Versioning**: Use semantic versioning and release notes
2. **Comprehensive Testing**: Test with various use cases
3. **Documentation**: Create comprehensive documentation
4. **Test Coverage**: Ensure high test coverage for all migrated components