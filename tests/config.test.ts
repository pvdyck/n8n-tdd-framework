import { getConfig, loadConfig, FrameworkConfig } from '../src/config/config';
import * as fs from 'fs';
import * as path from 'path';

describe('Config', () => {
  const originalEnv = process.env;
  const originalCwd = process.cwd();
  const fixturesDir = path.join(__dirname, 'fixtures/config');
  
  beforeAll(() => {
    // Ensure fixtures directory exists
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });
  
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    // Clear the config cache
    (global as any).__n8nTddConfig = undefined;
    // Clear require cache for config module
    delete require.cache[require.resolve('../src/config/config')];
  });

  afterEach(() => {
    process.env = originalEnv;
    process.chdir(originalCwd);
    // Clear the config cache
    (global as any).__n8nTddConfig = undefined;
    // Clear require cache for config module
    delete require.cache[require.resolve('../src/config/config')];
    
    // Clean up any test files created in fixtures directory
    if (fs.existsSync(fixturesDir)) {
      const files = fs.readdirSync(fixturesDir);
      files.forEach(file => {
        const filePath = path.join(fixturesDir, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  describe('getConfig', () => {
    test('should return default config when no env vars or config file', () => {
      // Ensure no config file exists
      const configPath = path.join(process.cwd(), 'n8n-tdd-config.json');
      if (fs.existsSync(configPath)) {
        fs.renameSync(configPath, configPath + '.bak');
      }

      const config = getConfig();

      expect(config.apiUrl).toBe('http://localhost:5678/api/v1');
      expect(config.apiKey).toBeUndefined();
      expect(config.templatesDir).toBe('./templates');
      expect(config.testsDir).toBe('./tests');
      expect(config.timeout).toBe(30000);

      // Restore config file if it existed
      if (fs.existsSync(configPath + '.bak')) {
        fs.renameSync(configPath + '.bak', configPath);
      }
    });

    test('should load config from environment variables', () => {
      process.env.N8N_API_URL = 'http://test.com/api/v1';
      process.env.N8N_API_KEY = 'test-key-123';
      process.env.N8N_TEMPLATES_DIR = './custom-templates';
      process.env.N8N_TESTS_DIR = './custom-tests';
      process.env.N8N_TIMEOUT = '60000';

      const config = getConfig();

      expect(config.apiUrl).toBe('http://test.com/api/v1');
      expect(config.apiKey).toBe('test-key-123');
      expect(config.templatesDir).toBe('./custom-templates');
      expect(config.testsDir).toBe('./custom-tests');
      expect(config.timeout).toBe(60000);
    });

    test('should cache config after first load', () => {
      process.env.N8N_API_KEY = 'first-key';
      
      const config1 = getConfig();
      expect(config1.apiKey).toBe('first-key');

      // Change env var
      process.env.N8N_API_KEY = 'second-key';
      
      // Should still return cached config
      const config2 = getConfig();
      expect(config2.apiKey).toBe('first-key');
      expect(config1).toBe(config2); // Same object reference
    });
  });

  describe('loadConfig', () => {
    test('should load config from file via env var', () => {
      const testConfig: FrameworkConfig = {
        apiUrl: 'http://file.com/api/v1',
        apiKey: 'file-key',
        templatesDir: './file-templates',
        testsDir: './file-tests'
      };

      const configPath = path.join(__dirname, 'fixtures/config/test-config.json');
      fs.writeFileSync(configPath, JSON.stringify(testConfig));

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;
      
      // Need to set configPath in env
      process.env.N8N_CONFIG_PATH = configPath;
      
      const config = getConfig();

      expect(config.apiUrl).toBe('http://file.com/api/v1');
      expect(config.apiKey).toBe('file-key');
      expect(config.templatesDir).toBe('./file-templates');
      expect(config.testsDir).toBe('./file-tests');

      // Clean up
      fs.unlinkSync(configPath);
      delete process.env.N8N_CONFIG_PATH;
    });

    test('should merge file config with env vars (env vars take precedence)', () => {
      const testConfig: FrameworkConfig = {
        apiUrl: 'http://file.com/api/v1',
        apiKey: 'file-key'
      };

      const configPath = path.join(__dirname, 'fixtures/config/test-config-merge.json');
      fs.writeFileSync(configPath, JSON.stringify(testConfig));

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;
      
      // Set env vars that should override file values
      process.env.N8N_CONFIG_PATH = configPath;
      process.env.N8N_API_KEY = 'env-key';

      const config = getConfig();

      expect(config.apiUrl).toBe('http://file.com/api/v1'); // From file
      expect(config.apiKey).toBe('env-key'); // From env (overrides file)

      // Clean up
      fs.unlinkSync(configPath);
      delete process.env.N8N_CONFIG_PATH;
    });

    test('should handle non-existent config file', () => {
      const config = loadConfig({ configPath: './non-existent-config.json' });

      // Should return default config
      expect(config.apiUrl).toBe('http://localhost:5678/api/v1');
      expect(config.apiKey).toBeUndefined();
    });

    test('should handle invalid JSON in config file', () => {
      const configPath = path.join(__dirname, 'fixtures/config/invalid-config.json');
      fs.writeFileSync(configPath, 'invalid json content');

      const config = loadConfig({ configPath });

      // Should return default config on error
      expect(config.apiUrl).toBe('http://localhost:5678/api/v1');
      expect(config.apiKey).toBeUndefined();

      // Clean up
      fs.unlinkSync(configPath);
    });

    test('should handle timeout from env var', () => {
      process.env.N8N_TIMEOUT = '60000';
      
      const config = getConfig();
      
      expect(config.timeout).toBe(60000);
    });

    test('should handle custom config path from env var', () => {
      const customConfig: FrameworkConfig = {
        apiKey: 'custom-path-key',
        templatesDir: './custom-templates'
      };

      const customPath = path.join(__dirname, 'fixtures/config/custom-n8n-config.json');
      fs.writeFileSync(customPath, JSON.stringify(customConfig));

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;
      
      process.env.N8N_CONFIG_PATH = customPath;

      const config = getConfig();

      expect(config.apiKey).toBe('custom-path-key');
      expect(config.templatesDir).toBe('./custom-templates');

      // Clean up
      fs.unlinkSync(customPath);
      delete process.env.N8N_CONFIG_PATH;
    });

    test('should search for config file in parent directories', () => {
      // Create a temporary directory structure
      const tempDir = path.join(process.cwd(), 'temp-config-test');
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir, { recursive: true });

      // Create config in parent directory
      const parentConfig: FrameworkConfig = {
        apiKey: 'parent-key',
        templatesDir: './parent-templates'
      };
      fs.writeFileSync(path.join(tempDir, 'n8n-tdd-config.json'), JSON.stringify(parentConfig));

      // Change to subdirectory
      process.chdir(subDir);

      const config = loadConfig();

      expect(config.apiKey).toBe('parent-key');
      expect(config.templatesDir).toBe('./parent-templates');

      // Clean up
      process.chdir(originalCwd);
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test('should handle partial config in file', () => {
      const partialConfig = {
        apiKey: 'partial-key'
        // Other fields missing
      };

      const configPath = path.join(__dirname, 'fixtures/config/partial-config.json');
      fs.writeFileSync(configPath, JSON.stringify(partialConfig));

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;
      process.env.N8N_CONFIG_PATH = configPath;
      
      const config = getConfig();

      expect(config.apiKey).toBe('partial-key');
      // Other fields should have defaults
      expect(config.apiUrl).toBe('http://localhost:5678/api/v1');
      expect(config.templatesDir).toBe('./templates');
      expect(config.testsDir).toBe('./tests');

      // Clean up
      fs.unlinkSync(configPath);
      delete process.env.N8N_CONFIG_PATH;
    });

    test('should load envPath if specified', () => {
      const envContent = 'N8N_API_KEY=env-file-key\nN8N_API_URL=http://env-file.com/api/v1';
      const envPath = path.join(process.cwd(), '.env.test');
      fs.writeFileSync(envPath, envContent);

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;
      
      const config = loadConfig({ envPath });

      expect(config.apiKey).toBe('env-file-key');
      expect(config.apiUrl).toBe('http://env-file.com/api/v1');

      // Clean up
      fs.unlinkSync(envPath);
    });

    test('should handle empty config file', () => {
      const configPath = path.join(__dirname, 'fixtures/config/empty-config.json');
      fs.writeFileSync(configPath, '{}');

      const config = loadConfig({ configPath });

      // Should return all defaults
      expect(config.apiUrl).toBe('http://localhost:5678/api/v1');
      expect(config.apiKey).toBeUndefined();
      expect(config.templatesDir).toBe('./templates');
      expect(config.testsDir).toBe('./tests');

      // Clean up
      fs.unlinkSync(configPath);
    });

    test('should handle config with extra fields', () => {
      const configWithExtras = {
        apiKey: 'test-key',
        extraField: 'should be ignored',
        anotherExtra: 123
      };

      const configPath = path.join(__dirname, 'fixtures/config/extra-config.json');
      fs.writeFileSync(configPath, JSON.stringify(configWithExtras));

      const config = loadConfig({ configPath });

      expect(config.apiKey).toBe('test-key');
      // Extra fields should not cause issues
      expect((config as any).extraField).toBeUndefined();
      expect((config as any).anotherExtra).toBeUndefined();

      // Clean up
      fs.unlinkSync(configPath);
    });

    test('should handle config file from default location', () => {
      const defaultConfig: FrameworkConfig = {
        apiKey: 'default-location-key',
        templatesDir: './default-templates'
      };

      const configPath = path.join(process.cwd(), 'n8n-tdd-config.json');
      
      // Backup existing config if any
      let hadExistingConfig = false;
      if (fs.existsSync(configPath)) {
        hadExistingConfig = true;
        fs.renameSync(configPath, configPath + '.backup');
      }

      fs.writeFileSync(configPath, JSON.stringify(defaultConfig));

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;

      const config = getConfig();

      expect(config.apiKey).toBe('default-location-key');
      expect(config.templatesDir).toBe('./default-templates');

      // Clean up
      fs.unlinkSync(configPath);
      
      // Restore original config if it existed
      if (hadExistingConfig) {
        fs.renameSync(configPath + '.backup', configPath);
      }
    });

    test('should prefer env vars over config file', () => {
      const fileConfig: FrameworkConfig = {
        apiKey: 'file-key',
        apiUrl: 'http://file.com/api/v1',
        templatesDir: './file-templates'
      };

      const configPath = path.join(__dirname, 'fixtures/config/env-precedence-test.json');
      fs.writeFileSync(configPath, JSON.stringify(fileConfig));

      // Clear cached config
      (global as any).__n8nTddConfig = undefined;

      // Set env vars
      process.env.N8N_CONFIG_PATH = configPath;
      process.env.N8N_API_KEY = 'env-key';
      process.env.N8N_TEMPLATES_DIR = './env-templates';
      
      const config = getConfig();

      expect(config.apiKey).toBe('env-key'); // From env
      expect(config.apiUrl).toBe('http://file.com/api/v1'); // From file
      expect(config.templatesDir).toBe('./env-templates'); // From env

      // Clean up
      fs.unlinkSync(configPath);
      delete process.env.N8N_CONFIG_PATH;
      delete process.env.N8N_TEMPLATES_DIR;
    });
  });
});