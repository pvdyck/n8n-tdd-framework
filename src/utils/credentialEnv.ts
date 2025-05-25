import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Credential } from '../testing/types';

/**
 * Options for loading credentials from environment variables
 */
export interface CredentialEnvOptions {
  /**
   * Path to the .env file
   */
  envPath?: string;

  /**
   * Prefix for credential environment variables
   * @default 'N8N_CREDENTIAL_'
   */
  envPrefix?: string;

  /**
   * Whether to throw an error if a credential is not found in environment variables
   * @default true
   */
  required?: boolean;
}

/**
 * Default options for credential environment variables
 */
const defaultOptions: CredentialEnvOptions = {
  envPrefix: 'N8N_CREDENTIAL_',
  required: true
};

/**
 * Load credentials from environment variables
 *
 * @param options - Options for loading credentials
 * @returns Map of credential names to credential objects
 */
export function loadCredentialsFromEnv(options?: CredentialEnvOptions): Map<string, Credential> {
  const opts = { ...defaultOptions, ...options };
  const credentials = new Map<string, Credential>();

  // Load .env file if it exists and wasn't already loaded
  const envPath = opts.envPath || path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  // Find all environment variables with the credential prefix
  const prefix = opts.envPrefix || 'N8N_CREDENTIAL_';
  const credentialVars = Object.keys(process.env)
    .filter(key => key.startsWith(prefix));

  // Group variables by credential name
  const credentialGroups = new Map<string, Record<string, string>>();

  credentialVars.forEach(key => {
    // Extract credential name and property from the environment variable key
    // Format: N8N_CREDENTIAL_<NAME>_<PROPERTY>
    // We need to handle both patterns:
    // 1. N8N_CREDENTIAL_API_USERNAME (simple name, uppercase property)
    // 2. N8N_CREDENTIAL_TEST_ENV_CRED_username (complex name, lowercase property)
    
    const withoutPrefix = key.substring(prefix.length);
    const parts = withoutPrefix.split('_');
    
    if (parts.length < 2) return;
    
    // Known credential properties (both uppercase and lowercase variants)
    const knownProperties = [
      'TYPE', 'type',
      'USERNAME', 'username', 
      'PASSWORD', 'password',
      'CLIENT_ID', 'client_id',
      'CLIENT_SECRET', 'client_secret',
      'ACCESS_TOKEN', 'access_token',
      'REFRESH_TOKEN', 'refresh_token',
      'SCOPE', 'scope',
      'HOST', 'host',
      'PORT', 'port',
      'DATABASE', 'database',
      'API_KEY', 'apiKey', 'api_key'
    ];
    
    // Find the property by checking from the end
    let credentialName = '';
    let propertyName = '';
    
    // Check if the last part is a known property
    const lastPart = parts[parts.length - 1];
    if (knownProperties.includes(lastPart)) {
      propertyName = lastPart.toLowerCase();
      credentialName = parts.slice(0, -1).join('_');
    } else if (parts.length > 2) {
      // Check if last two parts combined form a known property (e.g., CLIENT_ID)
      const lastTwoParts = parts.slice(-2).join('_');
      if (knownProperties.includes(lastTwoParts)) {
        propertyName = lastTwoParts.toLowerCase();
        credentialName = parts.slice(0, -2).join('_');
      } else {
        // Fallback: assume last part is property
        propertyName = lastPart.toLowerCase();
        credentialName = parts.slice(0, -1).join('_');
      }
    } else {
      // Simple case: NAME_PROPERTY
      credentialName = parts[0];
      propertyName = parts.slice(1).join('_').toLowerCase();
    }
    
    const value = process.env[key] || '';

    if (!credentialGroups.has(credentialName)) {
      credentialGroups.set(credentialName, {});
    }

    const group = credentialGroups.get(credentialName)!;
    group[propertyName] = value;
  });

  // Create credential objects from grouped variables
  credentialGroups.forEach((properties, name) => {
    if (!properties.type) {
      console.warn(`Credential "${name}" is missing required property "type"`);
      return;
    }

    const credential: Credential = {
      name,
      type: properties.type,
      data: {}
    };

    // Add all other properties to the credential data with field mapping
    Object.keys(properties).forEach(key => {
      if (key !== 'name' && key !== 'type') {
        // Map credential fields for compatibility
        const mappedKey = mapCredentialField(properties.type, key);
        credential.data[mappedKey] = properties[key];
      }
    });

    credentials.set(name, credential);
  });

  return credentials;
}

/**
 * Get a credential from environment variables
 *
 * @param name - Credential name
 * @param options - Options for loading credentials
 * @returns The credential
 * @throws Error if credential is not found and required is true
 */
export function getCredentialFromEnv(name: string, options?: CredentialEnvOptions): Credential {
  const opts = { ...defaultOptions, ...options };
  const credentials = loadCredentialsFromEnv(options);
  const credential = credentials.get(name);

  if (!credential && opts.required) {
    throw new Error(`Credential "${name}" not found in environment variables. Make sure to define it with the prefix ${opts.envPrefix}`);
  }

  return credential as Credential;
}

/**
 * Check if a credential exists in environment variables
 *
 * @param name - Credential name
 * @param options - Options for loading credentials
 * @returns True if the credential exists
 */
export function hasCredentialInEnv(name: string, options?: CredentialEnvOptions): boolean {
  const credentials = loadCredentialsFromEnv(options);
  return credentials.has(name);
}

/**
 * List all credentials from environment variables
 *
 * @param options - Options for loading credentials
 * @returns Array of credentials
 */
export function listCredentialsFromEnv(options?: CredentialEnvOptions): Credential[] {
  const credentials = loadCredentialsFromEnv(options);
  return Array.from(credentials.values());
}

/**
 * Resolve credential data from environment variables if needed
 *
 * @param credential - Credential to resolve
 * @param options - Options for loading credentials
 * @returns Resolved credential
 */
export function resolveCredentialFromEnv(credential: Credential, options?: CredentialEnvOptions): Credential {
  // If the credential has a special format indicating it should be loaded from env
  if (credential.type === 'env' && credential.data && credential.data.name) {
    const envCredential = getCredentialFromEnv(credential.data.name as string, options);
    if (envCredential) {
      return {
        ...credential,
        type: envCredential.type,
        data: envCredential.data
      };
    }
    throw new Error(`Credential "${credential.data.name}" not found in environment variables`);
  }

  // If the credential data contains references to environment variables, resolve them
  const resolvedData: Record<string, any> = {};

  Object.entries(credential.data || {}).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      // Extract environment variable name
      const envName = value.substring(2, value.length - 1);
      // Apply field mapping and resolve environment variable
      const mappedKey = mapCredentialField(credential.type, key);
      resolvedData[mappedKey] = process.env[envName] || '';
    } else {
      // Apply field mapping for non-environment variables too
      const mappedKey = mapCredentialField(credential.type, key);
      resolvedData[mappedKey] = value;
    }
  });

  return {
    ...credential,
    data: resolvedData
  };
}

/**
 * Map credential field names for different n8n versions
 * @private
 */
function mapCredentialField(credentialType: string, fieldName: string): string {
  // Field mappings for different credential types and n8n versions
  const fieldMappings: Record<string, Record<string, string>> = {
    'httpBasicAuth': {
      'username': 'user',  // Some n8n versions expect 'user' instead of 'username'
      'password': 'password'
    },
    'httpHeaderAuth': {
      'name': 'name',
      'value': 'value'
    }
  };

  return fieldMappings[credentialType]?.[fieldName] || fieldName;
}
