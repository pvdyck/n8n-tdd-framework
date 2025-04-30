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
    const parts = key.substring(prefix.length).split('_');
    if (parts.length < 2) return;

    const credentialName = parts[0];
    const propertyName = parts.slice(1).join('_').toLowerCase();
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

    // Add all other properties to the credential data
    Object.keys(properties).forEach(key => {
      if (key !== 'name' && key !== 'type') {
        credential.data[key] = properties[key];
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
      resolvedData[key] = process.env[envName] || '';
    } else {
      resolvedData[key] = value;
    }
  });

  return {
    ...credential,
    data: resolvedData
  };
}
