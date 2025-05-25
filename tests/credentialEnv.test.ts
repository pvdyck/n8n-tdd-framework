import * as fs from 'fs';
import * as path from 'path';
import {
  loadCredentialsFromEnv,
  getCredentialFromEnv,
  hasCredentialInEnv,
  resolveCredentialFromEnv
} from '../src/utils/credentialEnv';
import { Credential } from '../src/testing/types';

describe('Credential Environment Utilities', () => {
  // Save original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore process.env after each test
    process.env = originalEnv;
  });

  test('should load credentials from environment variables', () => {
    // Set up environment variables for testing
    process.env.N8N_CREDENTIAL_API_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_API_USERNAME = 'testuser';
    process.env.N8N_CREDENTIAL_API_PASSWORD = 'testpass';

    process.env.N8N_CREDENTIAL_OAUTH_TYPE = 'oAuth2Api';
    process.env.N8N_CREDENTIAL_OAUTH_CLIENT_ID = 'client123';
    process.env.N8N_CREDENTIAL_OAUTH_CLIENT_SECRET = 'secret456';

    // Load credentials
    const credentials = loadCredentialsFromEnv();

    // Check that credentials were loaded correctly
    expect(credentials.size).toBe(2);

    // Check API credential
    const apiCred = credentials.get('API');
    expect(apiCred).toBeDefined();
    expect(apiCred?.type).toBe('httpBasicAuth');
    expect(apiCred?.data.user).toBe('testuser'); // Field mapped from username to user
    expect(apiCred?.data.password).toBe('testpass');

    // Check OAuth credential
    const oauthCred = credentials.get('OAUTH');
    expect(oauthCred).toBeDefined();
    expect(oauthCred?.type).toBe('oAuth2Api');
    expect(oauthCred?.data.client_id).toBe('client123');
    expect(oauthCred?.data.client_secret).toBe('secret456');
  });

  test('should get a specific credential from environment variables', () => {
    // Set up environment variables for testing
    process.env.N8N_CREDENTIAL_API_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_API_USERNAME = 'testuser';
    process.env.N8N_CREDENTIAL_API_PASSWORD = 'testpass';

    // Get credential
    const credential = getCredentialFromEnv('API');

    // Check that credential was loaded correctly
    expect(credential).toBeDefined();
    expect(credential.type).toBe('httpBasicAuth');
    expect(credential.data.user).toBe('testuser'); // Field mapped from username to user
    expect(credential.data.password).toBe('testpass');
  });

  test('should throw error for non-existent credential', () => {
    // Expect error when getting non-existent credential
    expect(() => getCredentialFromEnv('NONEXISTENT')).toThrow(
      'Credential "NONEXISTENT" not found in environment variables'
    );
  });

  test('should not throw error for non-existent credential when required is false', () => {
    // Get non-existent credential with required=false
    const credential = getCredentialFromEnv('NONEXISTENT', { required: false });

    // Check that credential is undefined
    expect(credential).toBeUndefined();
  });

  test('should check if a credential exists in environment variables', () => {
    // Set up environment variables for testing
    process.env.N8N_CREDENTIAL_API_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_API_USERNAME = 'testuser';
    process.env.N8N_CREDENTIAL_API_PASSWORD = 'testpass';

    // Check existing credential
    expect(hasCredentialInEnv('API')).toBe(true);

    // Check non-existent credential
    expect(hasCredentialInEnv('NONEXISTENT')).toBe(false);
  });

  test('should resolve environment variables in credential data', () => {
    // Set up environment variables for testing
    process.env.API_USERNAME = 'envuser';
    process.env.API_PASSWORD = 'envpass';

    // Create credential with environment variable references
    const credential: Credential = {
      name: 'API',
      type: 'httpBasicAuth',
      data: {
        username: '${API_USERNAME}',
        password: '${API_PASSWORD}',
        regularValue: 'normal'
      }
    };

    // Resolve credential
    const resolved = resolveCredentialFromEnv(credential);

    // Check that environment variables were resolved
    expect(resolved.data.user).toBe('envuser'); // Field mapped from username to user
    expect(resolved.data.password).toBe('envpass');
    expect(resolved.data.regularValue).toBe('normal');
  });

  test('should handle special env credential type', () => {
    // Set up environment variables for testing
    process.env.N8N_CREDENTIAL_API_TYPE = 'httpBasicAuth';
    process.env.N8N_CREDENTIAL_API_USERNAME = 'testuser';
    process.env.N8N_CREDENTIAL_API_PASSWORD = 'testpass';

    // Create credential with env type
    const credential: Credential = {
      name: 'EnvRef',
      type: 'env',
      data: {
        name: 'API'
      }
    };

    // Resolve credential
    const resolved = resolveCredentialFromEnv(credential);

    // Check that credential was resolved from environment
    expect(resolved.type).toBe('httpBasicAuth');
    expect(resolved.data.user).toBe('testuser'); // Field mapped from username to user
    expect(resolved.data.password).toBe('testpass');
  });

  test('should throw error for non-existent env credential', () => {
    // Create credential with env type pointing to non-existent credential
    const credential: Credential = {
      name: 'EnvRef',
      type: 'env',
      data: {
        name: 'NONEXISTENT'
      }
    };

    // Expect error when resolving
    expect(() => resolveCredentialFromEnv(credential)).toThrow(
      'Credential "NONEXISTENT" not found in environment variables'
    );
  });

  test('should use custom environment variable prefix', () => {
    // Set up environment variables with custom prefix
    process.env.CUSTOM_API_TYPE = 'httpBasicAuth';
    process.env.CUSTOM_API_USERNAME = 'customuser';
    process.env.CUSTOM_API_PASSWORD = 'custompass';

    // Load credentials with custom prefix
    const credentials = loadCredentialsFromEnv({ envPrefix: 'CUSTOM_' });

    // Check that credentials were loaded correctly
    expect(credentials.size).toBe(1);

    // Check API credential
    const apiCred = credentials.get('API');
    expect(apiCred).toBeDefined();
    expect(apiCred?.type).toBe('httpBasicAuth');
    expect(apiCred?.data.user).toBe('customuser'); // Field mapped from username to user
    expect(apiCred?.data.password).toBe('custompass');
  });

  test('should load credentials from .env file', () => {
    // Create a temporary .env file
    const tempEnvPath = path.join(process.cwd(), '.env.test');
    const envContent = `
N8N_CREDENTIAL_TESTCRED_TYPE=httpBasicAuth
N8N_CREDENTIAL_TESTCRED_USERNAME=envfileuser
N8N_CREDENTIAL_TESTCRED_PASSWORD=envfilepass
`;
    fs.writeFileSync(tempEnvPath, envContent);

    // Load credentials from the .env file
    const credentials = loadCredentialsFromEnv({ envPath: tempEnvPath });

    // Check that credentials were loaded correctly
    const testCred = credentials.get('TESTCRED');
    expect(testCred).toBeDefined();
    expect(testCred?.type).toBe('httpBasicAuth');
    expect(testCred?.data.user).toBe('envfileuser'); // Field mapped from username to user
    expect(testCred?.data.password).toBe('envfilepass');

    // Clean up
    fs.unlinkSync(tempEnvPath);
  });
});