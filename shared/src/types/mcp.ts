// --- MCP (Model Context Protocol) Types ---

/** MCP Tool definition matching the MCP specification */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPProperty>;
    required?: string[];
  };
}

export interface MCPProperty {
  type: string;
  description?: string;
  enum?: string[];
  default?: unknown;
}

export interface MCPToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface MCPToolResponse {
  tool_call_id: string;
  content: string;
}

export interface MCPMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: MCPToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface MCPCompletionRequest {
  model: string;
  messages: MCPMessage[];
  tools: MCPTool[];
  temperature?: number;
  max_tokens?: number;
}

export interface MCPCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: MCPToolCall[];
    };
    finish_reason: 'stop' | 'tool_calls' | 'length';
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
