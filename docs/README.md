# n8n TDD Framework Documentation

This documentation is organized into two main sections:

## 📚 Framework User Documentation

Documentation for users who want to test their n8n workflows using the TDD framework.

### Getting Started
- [**Quick Start Guide**](../QUICKSTART.md) - Get up and running in 5 minutes
- [**Main README**](../README.md) - Complete framework overview and API reference
- [**Project Setup Guide**](../templates/project/docs/getting-started.md) - Detailed setup instructions

### TDD Methodology & Best Practices
- [**TDD Methodology for n8n**](./n8n-tdd-methodology.md) - Understanding TDD for workflows
- [**Step-by-Step Tutorial**](./tutorials/tdd-step-by-step.md) - Build a complete workflow using TDD
- [**Best Practices Guide**](./tdd-best-practices.md) - Core principles and patterns

### Examples
- [**Weather Alert System**](../examples/tdd-example/README.md) - Complete TDD example project
- [**Example Workflows**](../templates/project/workflows/examples/) - HTTP, Database, and Webhook examples
- [**Example Tests**](../templates/project/tests/) - Unit, Integration, and Declarative test examples

### Quick Reference
- **Create a new project**: `npx create-n8n-test-project my-project`
- **Run tests**: `npm test`
- **Start n8n**: `npm run docker:start`

---

## 🔧 Framework Developer Documentation

Documentation for contributors who want to help develop and improve the framework itself.

### Contributing
- [**Contributing Guidelines**](../CONTRIBUTING.md) - How to contribute to the framework
- [**Development Setup**](../CLAUDE.md) - Architecture and development commands
- [**Testing Strategy**](./planning/n8n-tdd-framework-testing-strategy.md) - Framework testing approach

### Project Management
- [**Documentation Index**](../n8n-tdd-framework-documentation-index.md) - All documentation overview
- [**Roadmap & Next Steps**](../n8n-tdd-framework-next-steps.md) - Future development plans
- [**CI/CD Strategy**](../n8n-tdd-framework-cicd.md) - Release and deployment process
- [**Changelog**](../CHANGELOG.md) - Version history and changes

### Technical Documentation
- [**API Documentation Guide**](./planning/n8n-tdd-framework-api-docs.md) - Documentation standards
- [**Implementation Guide**](./planning/n8n-tdd-framework-implementation-guide.md) - Historical migration notes

### Development Resources
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`
- **Generate Docs**: `npm run docs`

---

## 📖 Documentation Structure

```
docs/
├── README.md                    # This file - Documentation hub
├── n8n-tdd-methodology.md      # User: TDD methodology
├── tdd-best-practices.md       # User: Best practices
├── tutorials/
│   └── tdd-step-by-step.md    # User: Step-by-step tutorial
└── planning/                    # Developer: Implementation docs
    ├── n8n-tdd-framework-api-docs.md
    ├── n8n-tdd-framework-implementation-guide.md
    └── n8n-tdd-framework-testing-strategy.md
```

## 🚀 Quick Links

### For Users
- [Get Started Now](../QUICKSTART.md)
- [API Reference](../README.md#api-reference)
- [Examples](../examples/)

### For Contributors
- [Open Issues](https://github.com/pvdyck/n8n-tdd-framework/issues)
- [Development Guidelines](../CONTRIBUTING.md)
- [Architecture Overview](../CLAUDE.md#high-level-architecture)