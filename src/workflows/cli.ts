#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import WorkflowManager from './manager';
import { loadConfig } from '../config/config';

// Load configuration
loadConfig();

/**
 * CLI for managing n8n workflows
 */
export default class WorkflowCLI {
  private manager: WorkflowManager;
  
  /**
   * Create a new WorkflowCLI
   * 
   * @param options - CLI options
   */
  constructor(options?: { apiUrl?: string; apiKey?: string; templatesDir?: string }) {
    this.manager = new WorkflowManager(options);
  }
  
  /**
   * Run the CLI with the given arguments
   * 
   * @param args - Command line arguments
   */
  async run(args: string[]): Promise<void> {
    if (args.length < 1) {
      this.showHelp();
      return;
    }
    
    const command = args[0];
    
    try {
      await this.manager.connect();
      
      switch (command) {
        case 'list':
          await this.listWorkflows(args.slice(1));
          break;
        
        case 'get':
          await this.getWorkflow(args.slice(1));
          break;
        
        case 'create':
          await this.createWorkflow(args.slice(1));
          break;
        
        case 'delete':
          await this.deleteWorkflow(args.slice(1));
          break;
        
        case 'activate':
          await this.activateWorkflow(args.slice(1));
          break;
        
        case 'deactivate':
          await this.deactivateWorkflow(args.slice(1));
          break;
        
        case 'execute':
          await this.executeWorkflow(args.slice(1));
          break;
        
        case 'export':
          await this.exportWorkflow(args.slice(1));
          break;
        
        case 'export-all':
          await this.exportAllWorkflows(args.slice(1));
          break;
        
        case 'import':
          await this.importWorkflow(args.slice(1));
          break;
        
        case 'save-template':
          await this.saveTemplate(args.slice(1));
          break;
        
        case 'list-templates':
          await this.listTemplates(args.slice(1));
          break;
        
        case 'help':
          this.showHelp();
          break;
        
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(1);
    } finally {
      await this.manager.disconnect();
    }
  }
  
  /**
   * Show help message
   */
  private showHelp(): void {
    console.log('n8n Workflow Manager CLI');
    console.log('------------------------');
    console.log('');
    console.log('Available commands:');
    console.log('  list                           List all workflows');
    console.log('  get <id>                       Get workflow details');
    console.log('  create <name> [template]       Create a new workflow');
    console.log('  delete <id>                    Delete a workflow');
    console.log('  activate <id>                  Activate a workflow');
    console.log('  deactivate <id>                Deactivate a workflow');
    console.log('  execute <id> [data]            Execute a workflow');
    console.log('  export <id> [filename]         Export a workflow to a file');
    console.log('  export-all [directory]         Export all workflows to files');
    console.log('  import <filepath>              Import a workflow from a file');
    console.log('  save-template <id> <name>      Save a workflow as a template');
    console.log('  list-templates                 List all workflow templates');
    console.log('  help                           Show this help message');
  }
  
  /**
   * List all workflows
   */
  private async listWorkflows(args: string[]): Promise<void> {
    const active = args.includes('--active') ? true : args.includes('--inactive') ? false : undefined;
    
    const workflows = await this.manager.listWorkflows(active);
    
    console.log(`Found ${workflows.length} workflow(s):`);
    
    workflows.forEach(workflow => {
      console.log(`- ${workflow.name} (ID: ${workflow.id}, Active: ${workflow.active})`);
    });
  }
  
  /**
   * Get a workflow by ID
   */
  private async getWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow ID is required');
      return;
    }
    
    const id = args[0];
    const workflow = await this.manager.getWorkflow(id);
    
    console.log('Workflow Details:');
    console.log(`- Name: ${workflow.name}`);
    console.log(`- ID: ${workflow.id}`);
    console.log(`- Active: ${workflow.active}`);
    console.log(`- Nodes: ${workflow.nodes.length}`);
    
    console.log('\nNodes:');
    workflow.nodes.forEach(node => {
      console.log(`- ${node.name} (Type: ${node.type})`);
    });
    
    console.log('\nConnections:');
    Object.keys(workflow.connections || {}).forEach(sourceNode => {
      const connections = workflow.connections[sourceNode];
      Object.keys(connections).forEach(type => {
        connections[type].forEach(connection => {
          console.log(`- ${sourceNode} -> ${connection.node} (Type: ${type})`);
        });
      });
    });
  }
  
  /**
   * Create a new workflow
   */
  private async createWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow name is required');
      return;
    }
    
    const name = args[0];
    const templateName = args[1];
    
    let workflow;
    
    if (templateName) {
      workflow = await this.manager.createWorkflowFromTemplate(templateName, name);
      console.log(`Created workflow "${name}" from template "${templateName}" with ID: ${workflow.id}`);
    } else {
      workflow = await this.manager.createWorkflow({
        name,
        nodes: [],
        connections: {}
      });
      console.log(`Created empty workflow "${name}" with ID: ${workflow.id}`);
    }
  }
  
  /**
   * Delete a workflow
   */
  private async deleteWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow ID is required');
      return;
    }
    
    const id = args[0];
    await this.manager.deleteWorkflow(id);
    
    console.log(`Deleted workflow with ID: ${id}`);
  }
  
  /**
   * Activate a workflow
   */
  private async activateWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow ID is required');
      return;
    }
    
    const id = args[0];
    const workflow = await this.manager.activateWorkflow(id);
    
    console.log(`Activated workflow "${workflow.name}" with ID: ${workflow.id}`);
  }
  
  /**
   * Deactivate a workflow
   */
  private async deactivateWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow ID is required');
      return;
    }
    
    const id = args[0];
    const workflow = await this.manager.deactivateWorkflow(id);
    
    console.log(`Deactivated workflow "${workflow.name}" with ID: ${workflow.id}`);
  }
  
  /**
   * Execute a workflow
   */
  private async executeWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow ID is required');
      return;
    }
    
    const id = args[0];
    let data;
    
    if (args.length > 1) {
      try {
        data = JSON.parse(args[1]);
      } catch (error) {
        console.error(`Error parsing input data: ${(error as Error).message}`);
        return;
      }
    }
    
    const result = await this.manager.executeWorkflow(id, data);
    
    console.log('Execution Result:');
    console.log(JSON.stringify(result, null, 2));
  }
  
  /**
   * Export a workflow to a file
   */
  private async exportWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow ID is required');
      return;
    }
    
    const id = args[0];
    const filename = args[1];
    
    const outputPath = await this.manager.saveWorkflowToFile(id, filename);
    
    console.log(`Exported workflow to: ${outputPath}`);
  }
  
  /**
   * Export all workflows to files
   */
  private async exportAllWorkflows(args: string[]): Promise<void> {
    const outputDir = args[0];
    
    const exportedPaths = await this.manager.exportAllWorkflows(outputDir);
    
    console.log(`Exported ${exportedPaths.length} workflow(s) to:`);
    exportedPaths.forEach(path => {
      console.log(`- ${path}`);
    });
  }
  
  /**
   * Import a workflow from a file
   */
  private async importWorkflow(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.error('Error: Workflow file path is required');
      return;
    }
    
    const filePath = args[0];
    const workflow = await this.manager.importWorkflow(filePath);
    
    console.log(`Imported workflow "${workflow.name}" with ID: ${workflow.id}`);
  }
  
  /**
   * Save a workflow as a template
   */
  private async saveTemplate(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error('Error: Workflow ID and template name are required');
      return;
    }
    
    const id = args[0];
    const name = args[1];
    
    const workflow = await this.manager.getWorkflow(id);
    const templatePath = this.manager.saveWorkflowTemplate(name, workflow);
    
    console.log(`Saved workflow "${workflow.name}" as template "${name}" to: ${templatePath}`);
  }
  
  /**
   * List all workflow templates
   */
  private async listTemplates(args: string[]): Promise<void> {
    const templates = this.manager.listWorkflowTemplates();
    
    console.log(`Found ${templates.length} template(s):`);
    templates.forEach(template => {
      console.log(`- ${template}`);
    });
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new WorkflowCLI();
  cli.run(process.argv.slice(2)).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}