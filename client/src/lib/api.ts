const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Workflow
  getWorkflows: () => request<any[]>('/workflows'),
  getWorkflow: (id: string) => request<any>(`/workflows/${id}`),
  createWorkflow: (data: any) =>
    request<any>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: any) =>
    request<any>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWorkflow: (id: string) =>
    request<any>(`/workflows/${id}`, { method: 'DELETE' }),

  // Tools
  getTools: () => request<any[]>('/tools'),
  getTool: (name: string) => request<any>(`/tools/${name}`),
  createTool: (data: any) =>
    request<any>('/tools', { method: 'POST', body: JSON.stringify(data) }),
  updateTool: (name: string, data: any) =>
    request<any>(`/tools/${name}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleTool: (name: string) =>
    request<any>(`/tools/${name}/toggle`, { method: 'PATCH' }),
  deleteTool: (name: string) =>
    request<any>(`/tools/${name}`, { method: 'DELETE' }),

  // Executions
  getExecutions: (workflowId: string) => request<any[]>(`/executions/${workflowId}`),

  // MCP
  getMCPTools: () => request<any[]>('/mcp/tools'),
};
