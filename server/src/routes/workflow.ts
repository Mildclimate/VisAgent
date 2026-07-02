import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import type { WorkflowDefinition } from '@visagent/shared';

export const workflowRouter = Router();

/** List all workflows */
workflowRouter.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, name, description, version, created_at, updated_at
    FROM workflows ORDER BY updated_at DESC
  `).all();
  res.json(rows);
});

/** Get a single workflow with full definition */
workflowRouter.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  res.json({
    ...row,
    definition: JSON.parse(row.definition),
  });
});

/** Create a new workflow */
workflowRouter.post('/', (req: Request, res: Response) => {
  const { name, description, definition } = req.body;
  if (!name || !definition) {
    res.status(400).json({ error: 'name and definition are required' });
    return;
  }

  const id = uuid();
  const now = new Date().toISOString();
  const wf: WorkflowDefinition = {
    id,
    name,
    description: description || '',
    version: 1,
    ...definition,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(`
    INSERT INTO workflows (id, name, description, version, definition, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description || '', 1, JSON.stringify(wf), now, now);

  res.status(201).json(wf);
});

/** Update an existing workflow */
workflowRouter.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }

  const { name, description, definition } = req.body;
  const now = new Date().toISOString();
  const newVersion = existing.version + 1;

  // Archive current version
  db.prepare(`
    INSERT INTO workflow_versions (workflow_id, version, definition)
    VALUES (?, ?, ?)
  `).run(existing.id, existing.version, existing.definition);

  const wf: WorkflowDefinition = {
    id: existing.id,
    name: name || existing.name,
    description: description !== undefined ? description : existing.description,
    version: newVersion,
    ...definition,
    updatedAt: now,
  };

  db.prepare(`
    UPDATE workflows
    SET name = ?, description = ?, version = ?, definition = ?, updated_at = ?
    WHERE id = ?
  `).run(wf.name, wf.description || '', newVersion, JSON.stringify(wf), now, existing.id);

  res.json(wf);
});

/** Get version history for a workflow */
workflowRouter.get('/:id/versions', (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT id, version, created_at FROM workflow_versions
    WHERE workflow_id = ?
    ORDER BY version DESC
  `).all(req.params.id);
  res.json(rows);
});

/** Delete a workflow */
workflowRouter.delete('/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM workflows WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Workflow not found' });
    return;
  }
  res.json({ success: true });
});
