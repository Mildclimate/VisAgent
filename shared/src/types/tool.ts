// --- Tool Definition Types ---

export type ToolCategory = 'search' | 'code' | 'api' | 'data' | 'custom';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  /** JSON Schema for tool input (MCP standard) */
  inputSchema: Record<string, unknown>;
  /** Runtime: whether this tool is available */
  enabled: boolean;
  /** Whether to require user confirmation before execution */
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolRegistrationRequest {
  name: string;
  displayName: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  inputSchema: Record<string, unknown>;
  /** Handler code (JS function body) for custom tools */
  handler?: string;
}

export interface ToolExecutionRequest {
  toolName: string;
  arguments: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration: number;
}
