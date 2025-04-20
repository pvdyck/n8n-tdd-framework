import fs from 'fs';
import path from 'path';
import { N8nClient } from '../interfaces/n8nClient';
import RealN8nClient from '../clients/realN8nClient';
import { Workflow } from '../testing/types';
import * as n8nClientUtils from '../utils/n8nClient';
import { getConfig } from '../config/config';

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
   * @returns The created workflow
   */
  async createWorkflow(workflow: Workflow): Promise<Workflow> {
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
   * @returns The execution result
   */
  async executeWorkflow(id: string, data?: any): Promise<any> {
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
}