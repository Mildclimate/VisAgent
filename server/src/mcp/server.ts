import { db } from '../db/index.js';
import type { MCPTool, MCPCompletionRequest, MCPCompletionResponse } from '@visagent/shared';
import { config } from '../config.js';

/**
 * MCP Server: registers tools from the database and exposes them
 * in MCP-compliant format for LLM function calling.
 */
export class MCPServer {
  /** Get all enabled tools in MCP format */
  listTools(): MCPTool[] {
    const rows = db.prepare(
      'SELECT name, description, input_schema FROM tools WHERE enabled = 1'
    ).all() as any[];

    return rows.map((row) => ({
      name: row.name,
      description: row.description,
      inputSchema: JSON.parse(row.input_schema),
    }));
  }

  /** Get a specific tool definition */
  getTool(name: string): MCPTool | undefined {
    const row = db.prepare(
      'SELECT name, description, input_schema FROM tools WHERE name = ? AND enabled = 1'
    ).get(name) as any;

    if (!row) return undefined;

    return {
      name: row.name,
      description: row.description,
      inputSchema: JSON.parse(row.input_schema),
    };
  }

  /** Call an LLM with MCP tools available */
  async completion(request: MCPCompletionRequest): Promise<MCPCompletionResponse> {
    const body: Record<string, unknown> = {
      model: request.model || config.llm.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
    };

    // Attach tools if provided
    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }));
    }

    const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MCP completion failed: ${response.status} ${errText}`);
    }

    return (await response.json()) as MCPCompletionResponse;
  }
}

/** Singleton MCP server instance */
export const mcpServer = new MCPServer();
