import fs from 'fs';
import path from 'path';
import { N8nClient } from '../interfaces/n8nClient';
import RealN8nClient from '../clients/realN8nClient';
import { Credential, Workflow, TestCredential } from '../testing/types';
import * as n8nClientUtils from '../utils/n8nClient';
import { getConfig } from '../config/config';
import { listCredentialsFromEnv, getCredentialFromEnv } from '../utils/credentialEnv';
import { validateWorkflow, assertWorkflowValid } from './validator';

/**
 * Options for the WorkflowManager
 */
export interface WorkflowManagerOptions {
  /**
   * n8n API URL
   */
  apiUrl?: string;

  /**
   * n8n API key
   */
  apiKey?: string;

  /**
   * Base directory for workflow templates
   */
  templatesDir?: string;
}

/**
 * Manager for n8n workflows
 */
export default class WorkflowManager {
  private client: N8nClient;
  private templatesDir: string;

  /**
   * Create a new WorkflowManager
   *
   * @param options - Manager options
   */
  constructor(options?: WorkflowManagerOptions) {
    const config = getConfig();

    this.client = new RealN8nClient({
      apiUrl: options?.apiUrl || config.apiUrl,
      apiKey: options?.apiKey || config.apiKey
    });

    this.templatesDir = options?.templatesDir || config.templatesDir || './templates';
  }

  /**
   * Connect to the n8n API
   */
  async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Disconnect from the n8n API
   */
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  /**
   * List all workflows
   *
   * @param active - Filter by active status
   * @returns List of workflows
   */
  async listWorkflows(active?: boolean): Promise<Workflow[]> {
    return n8nClientUtils.listWorkflows(this.client, active);
  }

  /**
   * Get a workflow by ID
   *
   * @param id - Workflow ID
   * @returns The workflow
   */
  async getWorkflow(id: string): Promise<Workflow> {
    return n8nClientUtils.getWorkflow(this.client, id);
  }

  /**
   * Create a new workflow
   *
   * @param workflow - Workflow to create
   * @param skipValidation - Skip workflow validation (default: false)
   * @returns The created workflow
   */
  async createWorkflow(workflow: Workflow, skipValidation = false): Promise<Workflow> {
    if (!skipValidation) {
      assertWorkflowValid(workflow);
    }
    return n8nClientUtils.createWorkflow(this.client, workflow);
  }

  /**
   * Update a workflow
   *
   * @param id - Workflow ID
   * @param workflow - Workflow updates
   * @returns The updated workflow
   */
  async updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow> {
    return n8nClientUtils.updateWorkflow(this.client, id, workflow);
  }

  /**
   * Delete a workflow
   *
   * @param id - Workflow ID
   * @returns True if the workflow was deleted
   */
  async deleteWorkflow(id: string): Promise<boolean> {
    return n8nClientUtils.deleteWorkflow(this.client, id);
  }

  /**
   * Activate a workflow
   *
   * @param id - Workflow ID
   * @returns The activated workflow
   */
  async activateWorkflow(id: string): Promise<Workflow> {
    return n8nClientUtils.activateWorkflow(this.client, id);
  }

  /**
   * Deactivate a workflow
   *
   * @param id - Workflow ID
   * @returns The deactivated workflow
   */
  async deactivateWorkflow(id: string): Promise<Workflow> {
    return n8nClientUtils.deactivateWorkflow(this.client, id);
  }

  /**
   * Execute a workflow
   *
   * @param id - Workflow ID
   * @param data - Input data
   * @param validateBeforeExecution - Validate workflow before execution (default: true)
   * @returns The execution result
   */
  async executeWorkflow(id: string, data?: any, validateBeforeExecution = true): Promise<any> {
    if (validateBeforeExecution) {
      // Fetch and validate the workflow before execution
      const workflow = await this.getWorkflow(id);
      const validationResult = validateWorkflow(workflow);
      
      if (!validationResult.valid) {
        throw new Error(`Workflow validation failed: ${validationResult.errors.join('; ')}`);
      }
      
      if (validationResult.warnings.length > 0) {
        console.warn(`Workflow validation warnings: ${validationResult.warnings.join('; ')}`);
      }
    }
    
    return n8nClientUtils.executeWorkflow(this.client, id, data);
  }

  /**
   * Save a workflow to a file
   *
   * @param id - Workflow ID
   * @param filename - Output filename (optional)
   * @returns The path to the saved file
   */
  async saveWorkflowToFile(id: string, filename?: string): Promise<string> {
    const workflow = await this.getWorkflow(id);

    const outputFilename = filename || `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    const outputPath = path.resolve(process.cwd(), outputFilename);

    fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));

    return outputPath;
  }

  /**
   * Load a workflow from a file
   *
   * @param filePath - Path to the workflow file
   * @returns The loaded workflow
   */
  loadWorkflowFromFile(filePath: string): Workflow {
    const fullPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Workflow file not found: ${fullPath}`);
    }

    try {
      const workflow = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      return workflow;
    } catch (error) {
      throw new Error(`Failed to parse workflow file: ${(error as Error).message}`);
    }
  }

  /**
   * Import a workflow from a file to n8n
   *
   * @param filePath - Path to the workflow file
   * @returns The imported workflow
   */
  async importWorkflow(filePath: string): Promise<Workflow> {
    const workflow = this.loadWorkflowFromFile(filePath);
    return this.createWorkflow(workflow);
  }

  /**
   * Export all workflows to files
   *
   * @param outputDir - Output directory (optional)
   * @returns List of exported workflow paths
   */
  async exportAllWorkflows(outputDir?: string): Promise<string[]> {
    const workflows = await this.listWorkflows();
    const exportedPaths: string[] = [];

    const dir = outputDir || process.cwd();

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    for (const workflow of workflows) {
      const filename = path.join(dir, `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`);
      await this.saveWorkflowToFile(workflow.id!, filename);
      exportedPaths.push(filename);
    }

    return exportedPaths;
  }

  /**
   * Save a workflow as a template
   *
   * @param name - Template name
   * @param workflow - Workflow to save
   * @returns The path to the saved template
   */
  saveWorkflowTemplate(name: string, workflow: Workflow): string {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }

    const templatePath = path.join(this.templatesDir, `${name}.json`);

    // Remove runtime properties
    const template = { ...workflow };
    delete template.id;
    delete template.active;

    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));

    return templatePath;
  }

  /**
   * Load a workflow template
   *
   * @param name - Template name
   * @returns The loaded template
   */
  loadWorkflowTemplate(name: string): Workflow {
    const templatePath = path.join(this.templatesDir, `${name}.json`);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${name}`);
    }

    try {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      return template;
    } catch (error) {
      throw new Error(`Failed to parse template: ${(error as Error).message}`);
    }
  }

  /**
   * Create a workflow from a template
   *
   * @param templateName - Template name
   * @param workflowName - Name for the new workflow
   * @param settings - Settings to override in the template
   * @returns The created workflow
   */
  async createWorkflowFromTemplate(
    templateName: string,
    workflowName: string,
    settings?: Record<string, any>
  ): Promise<Workflow> {
    const template = this.loadWorkflowTemplate(templateName);

    const workflow = {
      ...template,
      name: workflowName,
      settings: {
        ...template.settings,
        ...settings
      }
    };

    return this.createWorkflow(workflow);
  }

  /**
   * List all available workflow templates
   *
   * @returns List of template names
   */
  listWorkflowTemplates(): string[] {
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }

    return fs.readdirSync(this.templatesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * List all credential types
   *
   * @returns List of credential types
   */
  async listCredentialTypes(): Promise<any[]> {
    return n8nClientUtils.listCredentialTypes(this.client);
  }

  /**
   * List all credentials
   *
   * @returns List of credentials
   */
  async listCredentials(): Promise<Credential[]> {
    return n8nClientUtils.listCredentials(this.client);
  }

  /**
   * Get a credential by ID
   *
   * @param id - Credential ID
   * @returns The credential
   */
  async getCredential(id: string): Promise<Credential> {
    return n8nClientUtils.getCredential(this.client, id);
  }

  /**
   * Create a new credential
   *
   * @param credential - Credential to create
   * @returns The created credential
   */
  async createCredential(credential: Credential): Promise<Credential> {
    return n8nClientUtils.createCredential(this.client, credential);
  }

  /**
   * Create a credential from environment variables
   *
   * @param name - Credential name in environment variables
   * @param options - Options for loading credentials
   * @returns The created credential
   */
  async createCredentialFromEnv(
    name: string,
    options?: { envPrefix?: string; envPath?: string }
  ): Promise<Credential> {
    return n8nClientUtils.createCredentialFromEnv(this.client, name, options);
  }

  /**
   * Create a credential from a test credential definition
   *
   * @param testCredential - Test credential definition
   * @returns The created credential
   */
  async createCredentialFromTestDefinition(testCredential: TestCredential): Promise<Credential> {
    return n8nClientUtils.createCredentialFromTestDefinition(this.client, testCredential);
  }

  /**
   * List all credentials from environment variables
   *
   * @param options - Options for loading credentials
   * @returns List of credentials from environment variables
   */
  listCredentialsFromEnv(options?: { envPrefix?: string; envPath?: string }): Credential[] {
    return listCredentialsFromEnv(options);
  }

  /**
   * Get a credential from environment variables
   *
   * @param name - Credential name
   * @param options - Options for loading credentials
   * @returns The credential or undefined if not found
   */
  getCredentialFromEnv(name: string, options?: { envPrefix?: string; envPath?: string }): Credential | undefined {
    return getCredentialFromEnv(name, { ...options, required: false });
  }

  /**
   * Check if a credential exists in environment variables
   *
   * @param name - Credential name
   * @param options - Options for loading credentials
   * @returns True if the credential exists
   */
  hasCredentialInEnv(name: string, options?: { envPrefix?: string; envPath?: string }): boolean {
    return n8nClientUtils.checkCredentialInEnv(name, options);
  }

  /**
   * Update a credential
   *
   * @param id - Credential ID
   * @param credential - Credential updates
   * @returns The updated credential
   */
  async updateCredential(
    id: string,
    credential: Partial<Credential>
  ): Promise<Credential> {
    return n8nClientUtils.updateCredential(this.client, id, credential);
  }

  /**
   * Delete a credential
   *
   * @param id - Credential ID
   * @returns True if the credential was deleted
   */
  async deleteCredential(id: string): Promise<boolean> {
    return n8nClientUtils.deleteCredential(this.client, id);
  }

  /**
   * Validate a workflow
   *
   * @param workflow - Workflow to validate
   * @returns Validation result with errors and warnings
   */
  validateWorkflow(workflow: Workflow) {
    return validateWorkflow(workflow);
  }

  /**
   * Validate a workflow by ID
   *
   * @param id - Workflow ID
   * @returns Validation result with errors and warnings
   */
  async validateWorkflowById(id: string) {
    const workflow = await this.getWorkflow(id);
    return validateWorkflow(workflow);
  }
}