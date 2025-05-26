# Contributing to n8n-tdd-framework

> 📌 **Note**: This guide is for contributing to the n8n-tdd-framework itself. If you're looking to use the framework to test your n8n workflows, see the [User Documentation](./docs/README.md#-framework-user-documentation).

Thank you for considering contributing to n8n-tdd-framework! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct: be respectful, considerate, and collaborative.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:

1. Check the existing issues to see if the problem has already been reported
2. If you're unable to find an open issue addressing the problem, create a new one

When creating a bug report, include as much information as possible:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots or code snippets if applicable
- Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! When creating an enhancement suggestion:

1. Use a clear and descriptive title
2. Provide a detailed description of the suggested enhancement
3. Explain why this enhancement would be useful
4. Include any relevant examples or mockups

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Run the tests to ensure your changes don't break existing functionality
5. Submit a pull request

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/pvdyck/n8n-tdd-framework.git
   cd n8n-tdd-framework
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run the tests:
   ```bash
   npm test
   ```

## Project Structure

- `src/`: Source code
  - `clients/`: n8n API client implementations
  - `config/`: Configuration utilities
  - `interfaces/`: TypeScript interfaces
  - `testing/`: Testing utilities
  - `utils/`: Utility functions
  - `workflows/`: Workflow management utilities
- `dist/`: Compiled output
- `examples/`: Example projects
- `tests/`: Tests

## Coding Guidelines

- Follow the existing code style
- Write clear, descriptive commit messages
- Include comments for complex code
- Write tests for new features
- Update documentation for API changes

## Testing

- Run tests before submitting a pull request:
  ```bash
  npm test
  ```

- Ensure code coverage remains high:
  ```bash
  npm test -- --coverage
  ```

## Documentation

- Update the README.md with any necessary changes
- Add JSDoc comments to all public APIs
- Update examples if needed

## Release Process

The release process is handled by the maintainers. If you're a maintainer:

1. Update the version in package.json
2. Update CHANGELOG.md
3. Create a new tag:
   ```bash
   git tag v0.x.y
   git push --tags
   ```
4. The CI/CD pipeline will handle the rest

## Questions?

If you have any questions, feel free to open an issue or reach out to the maintainers.

Thank you for contributing to n8n-tdd-framework!