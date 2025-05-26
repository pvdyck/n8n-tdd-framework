# n8n-tdd-framework Documentation Index

This document serves as a comprehensive index of all documentation for the n8n-tdd-framework npm package.

> **Note**: Documentation is organized into two main sections: **User Documentation** (for testing workflows) and **Developer Documentation** (for contributing to the framework).

## 📚 Framework User Documentation

Documentation for users who want to test their n8n workflows.

### Getting Started
| Document | Description |
|----------|-------------|
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute quick start guide |
| [README.md](./README.md) | Complete framework overview and API reference |
| [Project Setup Guide](./templates/project/docs/getting-started.md) | Detailed setup for new projects |

### Test-Driven Development (TDD)
| Document | Description | Type |
|----------|-------------|------|
| [TDD Methodology](./docs/n8n-tdd-methodology.md) | Complete guide to TDD for n8n workflows | Guide |
| [Step-by-Step Tutorial](./docs/tutorials/tdd-step-by-step.md) | Build a workflow using TDD from scratch | Tutorial |
| [TDD Best Practices](./docs/tdd-best-practices.md) | Patterns and anti-patterns for n8n TDD | Reference |

### Examples
| Document | Description |
|----------|-------------|
| [Weather Alert Example](./examples/tdd-example/README.md) | Complete TDD example project |
| [Basic Usage Example](./examples/basic-usage/) | Simple framework usage |
| [Declarative Testing Example](./examples/declarative-testing/) | JSON-based testing |
| [Template Workflows](./templates/project/workflows/examples/) | HTTP, Database, Webhook examples |

## 🔧 Framework Developer Documentation

Documentation for contributors who want to help develop the framework.

### Core Documentation
| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [CHANGELOG.md](./CHANGELOG.md) | Release history and changes |
| [CLAUDE.md](./CLAUDE.md) | AI assistant guidelines and architecture |
| [LICENSE](./LICENSE) | MIT License |

### Planning & Strategy
| Document | Description | Status |
|----------|-------------|--------|
| [Development Roadmap](./n8n-tdd-framework-next-steps.md) | Future enhancements and roadmap | Active |
| [CI/CD Strategy](./n8n-tdd-framework-cicd.md) | GitHub Actions and release process | Active |
| [API Documentation Guide](./docs/planning/n8n-tdd-framework-api-docs.md) | Documentation standards | Active |
| [Testing Strategy](./docs/planning/n8n-tdd-framework-testing-strategy.md) | Framework testing approach | Active |

### Historical Documents (Archived)
| Document | Description | Status |
|----------|-------------|--------|
| [NPM Packaging Plan](./n8n-tdd-framework-packaging-plan.md) | Original packaging strategy | Completed |
| [Migration Guide](./docs/archive/diane-to-framework-migration-plan.md) | Migration from diane | Completed |
| [Implementation Guide](./docs/planning/n8n-tdd-framework-implementation-guide.md) | Historical setup notes | Archive |

## 📖 Documentation Hub

For easier navigation, see our main documentation hub:
- **[Documentation README](./docs/README.md)** - Central documentation hub with categorized links

## 🚀 Quick Reference

### For Users
```bash
# Create a new test project
npx create-n8n-test-project my-project

# Run tests
npm test
npm run test:integration
npm run test:declarative

# Manage workflows
npm run workflow:list
npm run workflow:execute <id>
```

### For Developers
```bash
# Build the framework
npm run build

# Run framework tests
npm test
npm run test:coverage

# Lint and format
npm run lint
npm run lint:fix

# Generate API docs
npm run docs
```

## 📊 Documentation Statistics

- **User Documentation**: 7 main documents + examples
- **Developer Documentation**: 8 documents
- **Total Pages**: 15+ documents
- **Examples**: 3 complete example projects
- **Tutorials**: Step-by-step TDD guide

## 🔍 Finding Information

- **New to the framework?** Start with [QUICKSTART.md](./QUICKSTART.md)
- **Want to contribute?** Read [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Looking for examples?** Check the [examples/](./examples/) directory
- **Need API reference?** See [README.md#api-reference](./README.md#api-reference)
- **Architecture questions?** Review [CLAUDE.md](./CLAUDE.md)