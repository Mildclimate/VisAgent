import express from 'express';
import cors from 'cors';
import { workflowRouter } from './routes/workflow.js';
import { toolRouter } from './routes/tool.js';
import { mcpServer } from './mcp/server.js';
import { db } from './db/index.js';
import type { MCPCompletionRequest } from '@visagent/shared';
import { config } from './config.js';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // REST API routes
  app.use('/api/workflows', workflowRouter);
  app.use('/api/tools', toolRouter);

  // MCP endpoints
  app.get('/api/mcp/tools', (_req, res) => {
    res.json(mcpServer.listTools());
  });

  app.get('/api/mcp/tools/:name', (req, res) => {
    const tool = mcpServer.getTool(req.params.name);
    if (!tool) {
      res.status(404).json({ error: 'Tool not found' });
      return;
    }
    res.json(tool);
  });

  app.post('/api/mcp/completion', async (req, res) => {
    try {
      const body = req.body as MCPCompletionRequest;
      const result = await mcpServer.completion(body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Execution history
  app.get('/api/executions/:workflowId', (req, res) => {
    const rows = db.prepare(
      'SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 50'
    ).all(req.params.workflowId);
    res.json(rows);
  });

  return app;
}
