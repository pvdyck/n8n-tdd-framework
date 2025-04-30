# Sample package.json for n8n-tdd-framework

Below is a sample `package.json` file that would be used for the n8n-tdd-framework package:

```json
{
  "name": "n8n-tdd-framework",
  "version": "0.9.0",
  "description": "A Test-Driven Development framework for n8n workflows",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rimraf dist",
    "prebuild": "npm run clean",
    "prepare": "npm run build",
    "test": "jest --config jest.config.js",
    "lint": "eslint 'src/**/*.ts'",
    "lint:fix": "eslint 'src/**/*.ts' --fix",
    "prepublishOnly": "npm run lint && npm test",
    "docs": "typedoc --out docs/api src/index.ts",
    "version": "npm run build && git add -A dist",
    "postversion": "git push && git push --tags"
  },
  "keywords": [
    "n8n",
    "workflow",
    "automation",
    "testing",
    "tdd"
  ],
  "author": "",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/n8n-tdd-framework"
  },
  "bugs": {
    "url": "https://github.com/yourusername/n8n-tdd-framework/issues"
  },
  "homepage": "https://github.com/yourusername/n8n-tdd-framework#readme",
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "axios": "^1.8.4",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@typescript-eslint/eslint-plugin": "^8.29.1",
    "@typescript-eslint/parser": "^8.29.1",
    "eslint": "^9.24.0",
    "eslint-plugin-unused-imports": "^4.1.4",
    "jest": "^29.7.0",
    "rimraf": "^5.0.0",
    "ts-jest": "^29.3.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.2",
    "typedoc": "^0.25.12"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

## Key Features of This Configuration

1. **Main Entry Points**:
   - `main`: Points to the compiled JavaScript file
   - `types`: Points to the TypeScript declaration file

2. **Files to Include in Package**:
   - Only includes the compiled `dist` directory, `README.md`, and `LICENSE`
   - Source files are excluded to keep the package size small

3. **Scripts**:
   - `build`: Compiles TypeScript to JavaScript
   - `clean`: Removes the dist directory
   - `prebuild`: Runs before build to clean the dist directory
   - `prepare`: Runs automatically before the package is packed or published
   - `test`: Runs Jest tests
   - `lint`: Checks code style
   - `docs`: Generates API documentation
   - `version`: Runs when version is bumped, builds and adds dist to git
   - `postversion`: Pushes changes and tags after version bump

4. **Dependencies**:
   - Only includes runtime dependencies needed for the framework
   - Development dependencies are properly separated

5. **Engine Requirements**:
   - Specifies Node.js version requirements

This configuration follows npm best practices for TypeScript packages and ensures that the package is properly built and tested before publishing.