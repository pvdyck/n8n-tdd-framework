# Testing Strategy

This document outlines the testing approach for the n8n-tdd-framework.

## Current Implementation

The framework uses Jest for testing with the following configuration:
- **Test Runner**: Jest with TypeScript support (ts-jest)
- **Coverage Target**: 70% for all metrics (branches, functions, lines, statements)
- **Test Location**: `tests/` directory
- **Mocks**: Excluded from coverage reports

## Test Structure

### Unit Tests
- Test individual components in isolation
- Mock external dependencies
- Located in `tests/` with `.test.ts` extension

### Integration Tests
- Test components working together
- May require n8n instance running
- Use Docker for isolated testing environment

## Running Tests

```bash
npm test              # Run all tests
npm run test:coverage # Run tests with coverage report
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Naming**: Use descriptive test names
3. **Arrange-Act-Assert**: Follow AAA pattern
4. **Mock External Services**: Don't make real API calls in unit tests
5. **Clean Up**: Always clean up test resources

## Future Enhancements

- Performance testing for large workflows
- Compatibility testing across Node.js versions
- End-to-end testing with real n8n instances
- Visual regression testing for UI components