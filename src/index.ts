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

// Coverage functionality
export * from './testing/coverage';

// Docker management
export * from './docker';

// Utilities
export * from './utils/n8nClient';
export * from './config/config';

// CLI exports
export { default as WorkflowCLI } from './workflows/cli';