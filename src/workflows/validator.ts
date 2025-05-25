/**
 * Workflow validation utilities
 */

import { Workflow } from '../testing/types';
import { ValidationError } from '../errors';

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a workflow before execution
 */
export function validateWorkflow(workflow: Workflow): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic structure
  if (!workflow) {
    errors.push('Workflow is null or undefined');
    return { valid: false, errors, warnings };
  }

  // Validate workflow name
  if (!workflow.name || workflow.name.trim().length === 0) {
    errors.push('Workflow name is required');
  }

  // Validate nodes
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    errors.push('Workflow must have a nodes array');
  } else if (workflow.nodes.length === 0) {
    warnings.push('Workflow has no nodes');
  } else {
    // Validate each node
    const nodeIds = new Set<string>();
    const nodeNames = new Set<string>();

    workflow.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} is missing an ID`);
      } else if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      } else {
        nodeIds.add(node.id);
      }

      if (!node.name) {
        errors.push(`Node at index ${index} is missing a name`);
      } else if (nodeNames.has(node.name)) {
        warnings.push(`Duplicate node name: ${node.name}`);
      } else {
        nodeNames.add(node.name);
      }

      if (!node.type) {
        errors.push(`Node "${node.name || node.id}" is missing a type`);
      }

      if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
        warnings.push(`Node "${node.name || node.id}" has invalid position`);
      }

      if (!node.parameters) {
        warnings.push(`Node "${node.name || node.id}" has no parameters`);
      }
    });
  }

  // Validate connections
  if (!workflow.connections) {
    workflow.connections = {};
    warnings.push('Workflow has no connections defined');
  } else {
    // Validate connection structure
    Object.entries(workflow.connections).forEach(([sourceName, outputs]) => {
      // Check if source node exists
      const sourceExists = workflow.nodes?.some(n => n.name === sourceName);
      if (!sourceExists) {
        errors.push(`Connection references non-existent source node: ${sourceName}`);
      }

      if (!outputs.main || !Array.isArray(outputs.main)) {
        errors.push(`Invalid connection structure for node: ${sourceName}`);
      } else {
        outputs.main.forEach((outputConnections, outputIndex) => {
          if (!Array.isArray(outputConnections)) {
            errors.push(`Invalid connection at output ${outputIndex} of node: ${sourceName}`);
          } else {
            outputConnections.forEach((connection) => {
              if (!connection.node) {
                errors.push(`Connection from ${sourceName} missing target node`);
              } else {
                // Check if target node exists
                const targetExists = workflow.nodes?.some(n => n.name === connection.node);
                if (!targetExists) {
                  errors.push(`Connection references non-existent target node: ${connection.node}`);
                }
              }

              if (typeof connection.type !== 'string') {
                warnings.push(`Connection from ${sourceName} to ${connection.node} missing type`);
              }

              if (typeof connection.index !== 'number') {
                warnings.push(`Connection from ${sourceName} to ${connection.node} missing index`);
              }
            });
          }
        });
      }
    });
  }

  // Check for isolated nodes (not connected)
  if (workflow.nodes && workflow.nodes.length > 1) {
    const connectedNodes = new Set<string>();
    
    // Add all source nodes
    Object.keys(workflow.connections || {}).forEach(name => connectedNodes.add(name));
    
    // Add all target nodes
    Object.values(workflow.connections || {}).forEach(outputs => {
      outputs.main?.forEach(connections => {
        connections?.forEach(conn => {
          if (conn.node) connectedNodes.add(conn.node);
        });
      });
    });

    // Check for isolated nodes
    workflow.nodes.forEach(node => {
      if (node.name && !connectedNodes.has(node.name) && 
          node.type !== 'n8n-nodes-base.start' && 
          !node.type.includes('Trigger')) {
        warnings.push(`Node "${node.name}" is not connected to any other node`);
      }
    });
  }

  // Check for circular dependencies
  const cycles = detectCircularDependencies(workflow);
  if (cycles.length > 0) {
    errors.push(`Circular dependency detected: ${cycles.join(' -> ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Detect circular dependencies in workflow
 */
function detectCircularDependencies(workflow: Workflow): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[] = [];

  function hasCycle(nodeName: string, path: string[] = []): boolean {
    if (recursionStack.has(nodeName)) {
      const cycleStart = path.indexOf(nodeName);
      cycles.push(...path.slice(cycleStart), nodeName);
      return true;
    }

    if (visited.has(nodeName)) {
      return false;
    }

    visited.add(nodeName);
    recursionStack.add(nodeName);
    path.push(nodeName);

    const connections = workflow.connections?.[nodeName];
    if (connections?.main) {
      for (const outputConnections of connections.main) {
        if (outputConnections) {
          for (const connection of outputConnections) {
            if (connection.node && hasCycle(connection.node, [...path])) {
              return true;
            }
          }
        }
      }
    }

    recursionStack.delete(nodeName);
    return false;
  }

  // Check each node
  workflow.nodes?.forEach(node => {
    if (node.name && !visited.has(node.name)) {
      hasCycle(node.name);
    }
  });

  return cycles;
}

/**
 * Throw if workflow validation fails
 */
export function assertWorkflowValid(workflow: Workflow): void {
  const result = validateWorkflow(workflow);
  
  if (!result.valid) {
    throw new ValidationError(
      `Workflow validation failed: ${result.errors.join('; ')}`,
      { errors: result.errors, warnings: result.warnings }
    );
  }
}