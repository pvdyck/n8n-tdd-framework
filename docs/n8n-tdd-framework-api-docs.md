# API Documentation Standards

This document outlines the standards for API documentation in the n8n-tdd-framework.

## Documentation Requirements

1. **All public APIs** must be documented with JSDoc comments
2. **Examples** should be provided for complex methods
3. **Parameters and return types** must be clearly specified
4. **Breaking changes** must be documented in CHANGELOG.md

## JSDoc Standards

```typescript
/**
 * Brief description of the method
 * 
 * @param {string} param1 - Description of parameter
 * @param {Object} options - Configuration options
 * @returns {Promise<Result>} Description of return value
 * @throws {Error} When validation fails
 * @example
 * const result = await method('value', { key: 'value' });
 */
```

## API Documentation Generation

Run `npm run docs` to generate TypeDoc documentation in the `docs/api` directory.