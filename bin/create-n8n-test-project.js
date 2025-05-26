#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function copyTemplates(sourceDir, targetDir) {
  const files = fs.readdirSync(sourceDir);
  
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }
      copyTemplates(sourcePath, targetPath);
    } else {
      // Don't overwrite existing files
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  });
}

function createProject(projectName) {
  const projectPath = path.join(process.cwd(), projectName);
  
  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    log(`Error: Directory ${projectName} already exists!`, 'yellow');
    process.exit(1);
  }
  
  log(`\nCreating n8n TDD project: ${projectName}`, 'green');
  
  // Create project directory
  fs.mkdirSync(projectPath, { recursive: true });
  
  // Create directory structure
  const directories = [
    'workflows',
    'workflows/templates',
    'tests',
    'tests/unit',
    'tests/integration',
    'tests/declarative',
    'fixtures',
    'fixtures/data',
    'fixtures/credentials',
    '.vscode',
    'docs'
  ];
  
  directories.forEach(dir => {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
    log(`  ✓ Created ${dir}/`, 'green');
  });
  
  // Create package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: "n8n workflow tests using TDD framework",
    scripts: {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "test:integration": "jest --config jest.integration.config.js",
      "test:declarative": "n8n-tdd test tests/declarative",
      "workflow:list": "n8n-tdd list",
      "workflow:create": "n8n-tdd create",
      "workflow:execute": "n8n-tdd execute",
      "docker:start": "n8n-tdd docker:start",
      "docker:stop": "n8n-tdd docker:stop",
      "docker:status": "n8n-tdd docker:status",
      "setup": "npm run docker:start && echo 'Waiting for n8n to start...' && sleep 10"
    },
    keywords: ["n8n", "workflow", "testing", "tdd"],
    author: "",
    license: "ISC",
    devDependencies: {
      "@types/jest": "^29.5.14",
      "@types/node": "^20.11.5",
      "jest": "^29.7.0",
      "ts-jest": "^29.3.0",
      "typescript": "^5.8.2"
    },
    dependencies: {
      "n8n-tdd-framework": "^0.13.0",
      "dotenv": "^16.5.0"
    }
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  log('  ✓ Created package.json', 'green');
  
  // Create .env.example
  const envExample = `# n8n API Configuration
N8N_API_URL=http://localhost:5678/api/v1
N8N_API_KEY=your-api-key-here

# n8n Docker Configuration (for local development)
N8N_ENCRYPTION_KEY=test-encryption-key
N8N_PORT=5678

# Test Credentials (prefix with N8N_CREDENTIAL_)
# Example: HTTP Basic Auth
N8N_CREDENTIAL_test_http_TYPE=httpBasicAuth
N8N_CREDENTIAL_test_http_username=testuser
N8N_CREDENTIAL_test_http_password=testpass

# Example: API Key Auth
N8N_CREDENTIAL_test_api_TYPE=httpHeaderAuth
N8N_CREDENTIAL_test_api_name=X-API-Key
N8N_CREDENTIAL_test_api_value=test-api-key-12345

# Example: Database
N8N_CREDENTIAL_test_postgres_TYPE=postgres
N8N_CREDENTIAL_test_postgres_host=localhost
N8N_CREDENTIAL_test_postgres_port=5432
N8N_CREDENTIAL_test_postgres_database=testdb
N8N_CREDENTIAL_test_postgres_user=testuser
N8N_CREDENTIAL_test_postgres_password=testpass
`;
  
  fs.writeFileSync(path.join(projectPath, '.env.example'), envExample);
  log('  ✓ Created .env.example', 'green');
  
  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.*.local

# Test coverage
coverage/
*.lcov

# IDE
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# n8n data
n8n_data/
*.sqlite

# Logs
logs/
*.log
npm-debug.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Temporary files
tmp/
temp/
`;
  
  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);
  log('  ✓ Created .gitignore', 'green');
  
  // Create n8n-tdd-config.json
  const n8nConfig = {
    apiUrl: process.env.N8N_API_URL || "http://localhost:5678/api/v1",
    apiKey: process.env.N8N_API_KEY || "",
    workflowsDir: "./workflows",
    templatesDir: "./workflows/templates",
    testsDir: "./tests",
    credentialPrefix: "N8N_CREDENTIAL_"
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'n8n-tdd-config.json'),
    JSON.stringify(n8nConfig, null, 2)
  );
  log('  ✓ Created n8n-tdd-config.json', 'green');
  
  // Create jest.config.js
  const jestConfig = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/unit/**/*.test.ts'],
  collectCoverageFrom: [
    'workflows/**/*.{js,ts}',
    '!**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};`;
  
  fs.writeFileSync(path.join(projectPath, 'jest.config.js'), jestConfig);
  log('  ✓ Created jest.config.js', 'green');
  
  // Create jest.integration.config.js
  const jestIntegrationConfig = `module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['**/tests/integration/**/*.test.ts'],
  testTimeout: 60000,
  globalSetup: '<rootDir>/tests/integration/setup.ts',
  globalTeardown: '<rootDir>/tests/integration/teardown.ts'
};`;
  
  fs.writeFileSync(path.join(projectPath, 'jest.integration.config.js'), jestIntegrationConfig);
  log('  ✓ Created jest.integration.config.js', 'green');
  
  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "ES2020",
      module: "commonjs",
      lib: ["ES2020"],
      outDir: "./dist",
      rootDir: "./",
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      moduleResolution: "node",
      types: ["node", "jest"]
    },
    include: ["**/*.ts"],
    exclude: ["node_modules", "dist", "coverage"]
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
  log('  ✓ Created tsconfig.json', 'green');
  
  // Create docker-compose.yml
  const dockerCompose = `version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: ${projectName}-n8n
    ports:
      - "\${N8N_PORT:-5678}:5678"
    environment:
      - N8N_ENCRYPTION_KEY=\${N8N_ENCRYPTION_KEY:-test-encryption-key}
      - NODE_ENV=development
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_USER_MANAGEMENT_DISABLED=false
      - N8N_SECURE_COOKIE=false
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_TELEMETRY_ENABLED=false
      - N8N_VERSION_NOTIFICATIONS_ENABLED=false
      - N8N_TEMPLATES_ENABLED=true
      - N8N_API_ENABLED=true
      - N8N_API_KEY=\${N8N_API_KEY}
      - DB_TYPE=sqlite
    volumes:
      - n8n-data:/home/node/.n8n
      - ./workflows:/home/node/.n8n/workflows
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  # Optional: PostgreSQL for testing database workflows
  postgres:
    image: postgres:15
    container_name: ${projectName}-postgres
    environment:
      POSTGRES_USER: testuser
      POSTGRES_PASSWORD: testpass
      POSTGRES_DB: testdb
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  n8n-data:
  postgres-data:
`;
  
  fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), dockerCompose);
  log('  ✓ Created docker-compose.yml', 'green');
  
  // Create VS Code settings
  const vscodeSettings = {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "jest.autoRun": {
      "watch": true,
      "onStartup": ["all-tests"]
    },
    "jest.showCoverageOnLoad": true
  };
  
  fs.writeFileSync(
    path.join(projectPath, '.vscode/settings.json'),
    JSON.stringify(vscodeSettings, null, 2)
  );
  
  // Create VS Code extensions recommendations
  const vscodeExtensions = {
    recommendations: [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "firsttris.vscode-jest-runner",
      "orta.vscode-jest",
      "ms-azuretools.vscode-docker"
    ]
  };
  
  fs.writeFileSync(
    path.join(projectPath, '.vscode/extensions.json'),
    JSON.stringify(vscodeExtensions, null, 2)
  );
  
  // Create VS Code launch configuration
  const vscodeLaunch = {
    version: "0.2.0",
    configurations: [
      {
        name: "Debug Jest Tests",
        type: "node",
        request: "launch",
        runtimeExecutable: "npm",
        runtimeArgs: ["test", "--", "--runInBand", "--watchAll=false"],
        console: "integratedTerminal",
        internalConsoleOptions: "neverOpen"
      },
      {
        name: "Debug Current Test File",
        type: "node",
        request: "launch",
        runtimeExecutable: "npm",
        runtimeArgs: ["test", "--", "--runInBand", "--watchAll=false", "${relativeFile}"],
        console: "integratedTerminal",
        internalConsoleOptions: "neverOpen"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(projectPath, '.vscode/launch.json'),
    JSON.stringify(vscodeLaunch, null, 2)
  );
  log('  ✓ Created VS Code configuration', 'green');
  
  // Create tests/setup.ts
  const testSetup = `import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Global test timeout
jest.setTimeout(30000);

// Mock console methods if needed
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
};
`;
  
  fs.writeFileSync(path.join(projectPath, 'tests/setup.ts'), testSetup);
  log('  ✓ Created test setup file', 'green');
  
  // Copy template files if they exist
  const templatesDir = path.join(__dirname, '../templates/project');
  if (fs.existsSync(templatesDir)) {
    copyTemplates(templatesDir, projectPath);
    log('  ✓ Copied example templates and CLAUDE.md', 'green');
  }
  
  // Create README.md
  const readme = `# ${projectName}

n8n workflow tests using the n8n TDD Framework.

## Quick Start

1. **Copy environment file:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. **Edit .env file:**
   - Set your N8N_API_KEY
   - Configure any test credentials

3. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

4. **Start n8n (using Docker):**
   \`\`\`bash
   npm run docker:start
   \`\`\`

5. **Run tests:**
   \`\`\`bash
   npm test
   \`\`\`

## Project Structure

\`\`\`
${projectName}/
├── workflows/           # n8n workflow JSON files
├── tests/              # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests  
│   └── declarative/    # JSON-based declarative tests
├── fixtures/           # Test data and mock responses
├── docs/              # Additional documentation
└── n8n-tdd-config.json # Framework configuration
\`\`\`

## Available Scripts

- \`npm test\` - Run unit tests
- \`npm run test:watch\` - Run tests in watch mode
- \`npm run test:coverage\` - Run tests with coverage
- \`npm run test:integration\` - Run integration tests
- \`npm run test:declarative\` - Run declarative tests
- \`npm run workflow:list\` - List all workflows
- \`npm run workflow:execute <id>\` - Execute a workflow
- \`npm run docker:start\` - Start n8n container
- \`npm run docker:stop\` - Stop n8n container
- \`npm run docker:status\` - Check container status

## Writing Tests

### Unit Tests
Place unit tests in \`tests/unit/\` directory:

\`\`\`typescript
import { WorkflowManager } from 'n8n-tdd-framework';

describe('My Workflow', () => {
  let manager: WorkflowManager;
  
  beforeAll(async () => {
    manager = new WorkflowManager();
    await manager.connect();
  });
  
  it('should process data correctly', async () => {
    // Your test code here
  });
});
\`\`\`

### Declarative Tests
Place JSON test files in \`tests/declarative/\` directory. See examples in that folder.

## Environment Variables

See \`.env.example\` for all available environment variables.

## Documentation

- [n8n TDD Framework Documentation](https://github.com/pvdyck/n8n-tdd-framework)
- [n8n Documentation](https://docs.n8n.io)
`;
  
  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
  log('  ✓ Created README.md', 'green');
  
  log(`\n✨ Project created successfully!`, 'bright');
  log(`\nNext steps:`, 'cyan');
  log(`  cd ${projectName}`, 'blue');
  log(`  cp .env.example .env`, 'blue');
  log(`  # Edit .env with your API key`, 'yellow');
  log(`  npm install`, 'blue');
  log(`  npm run docker:start`, 'blue');
  log(`  npm test`, 'blue');
  log(`\nHappy testing! 🚀`, 'green');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  log('Usage: create-n8n-test-project <project-name>', 'yellow');
  process.exit(1);
}

const projectName = args[0];

// Validate project name
if (!/^[a-zA-Z0-9-_]+$/.test(projectName)) {
  log('Error: Project name can only contain letters, numbers, hyphens and underscores', 'yellow');
  process.exit(1);
}

createProject(projectName);