import { N8nClient } from '../interfaces/n8nClient';
import RealN8nClient from '../clients/realN8nClient';
import { Credential, Workflow } from '../testing/types';

/**
 * Create a new n8n client
 *
 * @param options - Client options
 * @returns A new n8n client
 */
export function createClient(options?: { apiUrl?: string; apiKey?: string }): N8nClient {
  return new RealN8nClient(options);
}

/**
 * List all workflows
 *
 * @param client - n8n client
 * @param active - Filter by active status
 * @returns List of workflows
 */
export async function listWorkflows(client: N8nClient, active?: boolean): Promise<Workflow[]> {
  const params: Record<string, any> = {};

  if (active !== undefined) {
    params.active = active;
  }

  const response = await client.get('/workflows', params);
  return response.data || [];
}

/**
 * Get a workflow by ID
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @returns The workflow
 */
export async function getWorkflow(client: N8nClient, id: string): Promise<Workflow> {
  const response = await client.get(`/workflows/${id}`);
  return response.data;
}

/**
 * Create a new workflow
 *
 * @param client - n8n client
 * @param workflow - Workflow to create
 * @returns The created workflow
 */
export async function createWorkflow(client: N8nClient, workflow: Workflow): Promise<Workflow> {
  const response = await client.post('/workflows', workflow);
  return response.data;
}

/**
 * Update a workflow
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @param workflow - Workflow updates
 * @returns The updated workflow
 */
export async function updateWorkflow(client: N8nClient, id: string, workflow: Partial<Workflow>): Promise<Workflow> {
  const response = await client.put(`/workflows/${id}`, workflow);
  return response.data;
}

/**
 * Delete a workflow
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @returns True if the workflow was deleted
 */
export async function deleteWorkflow(client: N8nClient, id: string): Promise<boolean> {
  await client.delete(`/workflows/${id}`);
  return true;
}

/**
 * Activate a workflow
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @returns The activated workflow
 */
export async function activateWorkflow(client: N8nClient, id: string): Promise<Workflow> {
  const response = await client.post(`/workflows/${id}/activate`, {});
  return response.data;
}

/**
 * Deactivate a workflow
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @returns The deactivated workflow
 */
export async function deactivateWorkflow(client: N8nClient, id: string): Promise<Workflow> {
  const response = await client.post(`/workflows/${id}/deactivate`, {});
  return response.data;
}

/**
 * Execute a workflow
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @param data - Input data
 * @returns The execution result
 */
export async function executeWorkflow(client: N8nClient, id: string, data?: any): Promise<any> {
  const response = await client.post(`/workflows/${id}/execute`, data || {});
  return response.data;
}

/**
 * Get workflow executions
 *
 * @param client - n8n client
 * @param id - Workflow ID
 * @param limit - Maximum number of executions to return
 * @returns List of executions
 */
export async function getWorkflowExecutions(client: N8nClient, id: string, limit: number = 20): Promise<any[]> {
  const response = await client.get(`/workflows/${id}/executions`, { limit });
  return response.data || [];
}

/**
 * Get an execution by ID
 *
 * @param client - n8n client
 * @param id - Execution ID
 * @returns The execution
 */
export async function getExecution(client: N8nClient, id: string): Promise<any> {
  const response = await client.get(`/executions/${id}`);
  return response.data;
}

/**
 * Wait for an execution to complete
 *
 * @param client - n8n client
 * @param id - Execution ID
 * @param timeout - Timeout in milliseconds
 * @param interval - Polling interval in milliseconds
 * @returns The completed execution
 */
export async function waitForExecution(
  client: N8nClient,
  id: string,
  timeout: number = 30000,
  interval: number = 1000
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const execution = await getExecution(client, id);

    if (execution.finished) {
      return execution;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Execution ${id} did not complete within ${timeout}ms`);
}

/**
 * List all credential types
 *
 * @param client - n8n client
 * @returns List of credential types
 */
export async function listCredentialTypes(client: N8nClient): Promise<any[]> {
  const response = await client.get('/credentials/types');
  return response.data || [];
}

/**
 * List all credentials
 *
 * @param client - n8n client
 * @returns List of credentials
 */
export async function listCredentials(client: N8nClient): Promise<Credential[]> {
  const response = await client.get('/credentials');
  return response.data || [];
}

/**
 * Get a credential by ID
 *
 * @param client - n8n client
 * @param id - Credential ID
 * @returns The credential
 */
export async function getCredential(client: N8nClient, id: string): Promise<Credential> {
  const response = await client.get(`/credentials/${id}`);
  return response.data;
}

/**
 * Create a new credential
 *
 * @param client - n8n client
 * @param credential - Credential to create
 * @returns The created credential
 */
export async function createCredential(client: N8nClient, credential: Credential): Promise<Credential> {
  const response = await client.post('/credentials', credential);
  return response.data;
}

/**
 * Update a credential
 *
 * @param client - n8n client
 * @param id - Credential ID
 * @param credential - Credential updates
 * @returns The updated credential
 */
export async function updateCredential(client: N8nClient, id: string, credential: Partial<Credential>): Promise<Credential> {
  const response = await client.put(`/credentials/${id}`, credential);
  return response.data;
}

/**
 * Delete a credential
 *
 * @param client - n8n client
 * @param id - Credential ID
 * @returns True if the credential was deleted
 */
export async function deleteCredential(client: N8nClient, id: string): Promise<boolean> {
  await client.delete(`/credentials/${id}`);
  return true;
}