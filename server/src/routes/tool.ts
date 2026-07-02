import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import type { ToolDefinition, ToolRegistrationRequest } from '@visagent/shared';

export const toolRouter = Router();

/** List all registered tools */
toolRouter.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM tools ORDER BY category, name').all() as any[];
  const tools: ToolDefinition[] = rows.map((row) => ({
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    category: row.category,
    parameters: JSON.parse(row.parameters),
    inputSchema: JSON.parse(row.input_schema),
    enabled: Boolean(row.enabled),
    requiresApproval: Boolean(row.requires_approval),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  res.json(tools);
});

/** Get a single tool */
toolRouter.get('/:name', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM tools WHERE name = ?').get(req.params.name) as any;
  if (!row) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }
  res.json({
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    category: row.category,
    parameters: JSON.parse(row.parameters),
    inputSchema: JSON.parse(row.input_schema),
    enabled: Boolean(row.enabled),
    requiresApproval: Boolean(row.requires_approval),
    handler: row.handler,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

/** Register a new tool */
toolRouter.post('/', (req: Request, res: Response) => {
  const body = req.body as ToolRegistrationRequest;
  if (!body.name || !body.displayName || !body.parameters) {
    res.status(400).json({ error: 'name, displayName, and parameters are required' });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO tools (name, display_name, description, category, parameters, input_schema, enabled, requires_approval, handler, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `).run(
    body.name,
    body.displayName,
    body.description || '',
    body.category || 'custom',
    JSON.stringify(body.parameters),
    JSON.stringify(body.inputSchema || {}),
    (body as any).requiresApproval ? 0 : 0,
    body.handler || null,
    now,
    now,
  );

  res.status(201).json({ name: body.name, displayName: body.displayName });
});

/** Update an existing tool */
toolRouter.put('/:name', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tools WHERE name = ?').get(req.params.name) as any;
  if (!existing) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  const body = req.body as Partial<ToolRegistrationRequest>;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE tools
    SET display_name = ?, description = ?, category = ?, parameters = ?,
        input_schema = ?, requires_approval = ?, handler = ?, updated_at = ?
    WHERE name = ?
  `).run(
    body.displayName || existing.display_name,
    body.description !== undefined ? body.description : existing.description,
    body.category || existing.category,
    body.parameters ? JSON.stringify(body.parameters) : existing.parameters,
    body.inputSchema ? JSON.stringify(body.inputSchema) : existing.input_schema,
    (body as any).requiresApproval !== undefined ? ((body as any).requiresApproval ? 1 : 0) : existing.requires_approval,
    body.handler !== undefined ? body.handler : existing.handler,
    now,
    req.params.name,
  );

  res.json({ name: req.params.name, updated: true });
});

/** Toggle tool enabled/disabled */
toolRouter.patch('/:name/toggle', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM tools WHERE name = ?').get(req.params.name) as any;
  if (!existing) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }

  const newEnabled = existing.enabled ? 0 : 1;
  db.prepare('UPDATE tools SET enabled = ?, updated_at = ? WHERE name = ?')
    .run(newEnabled, new Date().toISOString(), req.params.name);

  res.json({ name: req.params.name, enabled: Boolean(newEnabled) });
});

/** Delete a tool */
toolRouter.delete('/:name', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM tools WHERE name = ?').run(req.params.name);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Tool not found' });
    return;
  }
  res.json({ success: true });
});
