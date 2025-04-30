# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0] - 2025-04-25

### Added
- Credential management functionality
  - Create, read, update, and delete n8n credentials
  - List credential types
  - Secure credential handling
  - Integration with declarative testing framework
- Updated WorkflowManager with credential management methods
- Enhanced DeclarativeTestRunner to support credentials in tests
- Added comprehensive tests for credential management
- Updated documentation with credential management examples

### Changed
- Improved test resource management to handle credentials
- Enhanced test results to include credential information

### Fixed
- N/A

## [0.11.0] - 2025-04-20

### Added
- Docker management functionality
  - Start, stop, restart, and check status of n8n Docker containers
  - Automatic health checking
  - Container configuration options
  - Volume and environment variable management
- New CLI commands for Docker management
  - `docker:start` - Start n8n Docker container
  - `docker:stop` - Stop n8n Docker container
  - `docker:restart` - Restart n8n Docker container
  - `docker:status` - Get n8n Docker container status
  - `docker:help` - Show Docker help

### Changed
- Updated CLI to support Docker management commands
- Improved error handling for Docker operations

### Fixed
- N/A

## [0.10.0] - 2025-04-20

### Added
- Comprehensive coverage functionality
  - Track node, connection, and branch coverage in n8n workflows
  - Generate coverage reports in various formats (console, JSON, HTML)
  - Check coverage against configurable thresholds
  - Generate visual coverage dashboard
  - Organize and clean up coverage files
- New CLI commands for coverage management
  - `coverage:check` - Check coverage thresholds
  - `coverage:dashboard` - Generate coverage dashboard
  - `coverage:clean` - Clean up coverage files
- New npm scripts for coverage
  - `test:coverage` - Run tests with coverage
  - `test:coverage:check` - Check coverage thresholds
  - `test:coverage:dashboard` - Generate coverage dashboard
  - `test:coverage:dashboard:static` - Open static dashboard
  - `test:coverage:clean` - Clean up coverage files

### Changed
- Updated CLI to support local commands that don't require n8n connection

### Fixed
- N/A

## [0.9.0] - 2025-04-20

### Added
- Initial release of the n8n-tdd-framework
- Core workflow management functionality
  - Create, read, update, and delete workflows
  - Import and export workflows to/from files
  - Template-based workflow creation
  - Workflow execution
- Declarative testing framework
  - JSON-based test configuration
  - Automatic resource management
  - Assertion evaluation
  - Test reporting
- CLI tools for workflow management
- Comprehensive documentation and examples

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)