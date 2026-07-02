import { v4 as uuid } from 'uuid';
import { db } from '../db/index.js';
import { wsManager } from '../ws/index.js';
import type {
  WorkflowDefinition,
  WorkflowExecution,
  NodeExecutionResult,
  WorkflowNode,
  NodeType,
  LLMCallConfig,
  ToolExecConfig,
  ConditionConfig,
  CodeExecConfig,
} from '@visagent/shared';
import { config } from '../config.js';

/** In-memory execution registry */
const runningExecutions = new Map<string, WorkflowExecution>();

/** Execute a single node based on its type */
async function executeNode(
  node: WorkflowNode,
  context: Record<string, unknown>,
  executionId: string,
): Promise<NodeExecutionResult> {
  const startedAt = new Date().toISOString();

  wsManager.sendToExecution(executionId, {
    type: 'node:started',
    executionId,
    nodeId: node.id,
  });

  try {
    let output: Record<string, unknown> = {};

    switch (node.type as NodeType) {
      case 'start':
        output = context;
        break;

      case 'llm-call':
        output = await executeLLMCall(node.data.config as LLMCallConfig, context);
        break;

      case 'tool-exec':
        output = await executeToolCall(node.data.config as ToolExecConfig, context);
        break;

      case 'condition':
        output = evaluateCondition(node.data.config as ConditionConfig, context);
        break;

      case 'code-exec':
        output = await executeCode(node.data.config as CodeExecConfig, context);
        break;

      case 'end':
        output = context;
        break;

      default:
        output = {};
    }

    const finishedAt = new Date().toISOString();
    const result: NodeExecutionResult = {
      nodeId: node.id,
      status: 'success',
      input: { ...context },
      output,
      startedAt,
      finishedAt,
      duration: new Date(finishedAt).getTime() - new Date(startedAt).getTime(),
    };

    wsManager.sendToExecution(executionId, {
      type: 'node:completed',
      executionId,
      result,
    });

    return result;
  } catch (err: any) {
    const result: NodeExecutionResult = {
      nodeId: node.id,
      status: 'error',
      input: { ...context },
      output: {},
      error: err.message,
      startedAt,
      finishedAt: new Date().toISOString(),
    };

    wsManager.sendToExecution(executionId, {
      type: 'node:error',
      executionId,
      result,
    });

    return result;
  }
}

/** Execute LLM call node */
async function executeLLMCall(
  cfg: LLMCallConfig,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  // Resolve input mapping: replace {{ref}} with actual context values
  const resolvedContext = resolveInputMapping(cfg.inputMapping, context);

  const messages = [
    { role: 'system', content: cfg.systemPrompt },
    { role: 'user', content: interpolateTemplate(cfg.userPromptTemplate, resolvedContext) },
  ];

  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.llm.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model || config.llm.defaultModel,
      messages,
      temperature: cfg.temperature,
      max_tokens: cfg.maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`LLM call failed: ${response.status} ${err}`);
  }

  const data = await response.json() as any;
  return {
    content: data.choices?.[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
  };
}

/** Execute tool call node */
async function executeToolCall(
  cfg: ToolExecConfig,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  // Resolve dynamic params
  const resolvedParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(cfg.params)) {
    resolvedParams[key] = value;
  }

  for (const [key, injection] of Object.entries(cfg.paramInjection || {})) {
    switch (injection.type) {
      case 'reference':
        resolvedParams[key] = resolveReference(injection.value, context);
        break;
      case 'expression':
        resolvedParams[key] = evaluateExpression(injection.value, context);
        break;
      default:
        resolvedParams[key] = injection.value;
    }
  }

  // Look up tool handler from DB
  const tool = db.prepare('SELECT * FROM tools WHERE name = ? AND enabled = 1').get(cfg.toolName) as any;
  if (!tool) {
    throw new Error(`Tool "${cfg.toolName}" not found or disabled`);
  }

  if (tool.handler) {
    // Custom tool: execute JS handler in sandbox
    return executeSandboxedHandler(tool.handler, resolvedParams, context);
  }

  return { tool: cfg.toolName, params: resolvedParams, result: 'ok' };
}

/** Evaluate condition node */
function evaluateCondition(
  cfg: ConditionConfig,
  context: Record<string, unknown>,
): Record<string, unknown> {
  try {
    const result = evaluateExpression(cfg.expression, context);
    return { conditionResult: Boolean(result), nextBranch: result ? 'true' : 'false' };
  } catch {
    return { conditionResult: false, nextBranch: 'false', error: 'Expression evaluation failed' };
  }
}

/** Execute code in sandbox (JS only for now) */
async function executeCode(
  cfg: CodeExecConfig,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (cfg.language !== 'javascript') {
    throw new Error(`Unsupported language: ${cfg.language}. Only JavaScript is currently supported.`);
  }

  return executeSandboxedCode(cfg.code, context, cfg.timeout);
}

/** Resolve input mapping placeholders */
function resolveInputMapping(
  mapping: Record<string, string>,
  context: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (value.startsWith('$ref.')) {
      result[key] = resolveReference(value, context);
    } else if (value.startsWith('{{') && value.endsWith('}}')) {
      result[key] = evaluateExpression(value.slice(2, -2), context);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Resolve a reference like $ref.nodeId.field */
function resolveReference(ref: string, context: Record<string, unknown>): unknown {
  // Format: $ref.nodeId.field
  const parts = ref.replace('$ref.', '').split('.');
  let current: any = context;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

/** Simple expression evaluator */
function evaluateExpression(expr: string, context: Record<string, unknown>): unknown {
  const fn = new Function('ctx', `with(ctx) { return (${expr}); }`);
  return fn(context);
}

/** Template interpolation: replace {{key}} or {{nested.key.path}} with context values */
function interpolateTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
    const value = resolveDotPath(path.trim(), context);
    return value !== undefined ? String(value) : `{{${path}}}`;
  });
}

/** Resolve a dot-separated path against a nested object, e.g. "a.b.c" -> obj.a.b.c */
function resolveDotPath(path: string, obj: Record<string, unknown>): unknown {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

/** Execute a sandboxed JS handler */
async function executeSandboxedHandler(
  handlerCode: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const wrappedCode = `
    const params = ${JSON.stringify(params)};
    const context = ${JSON.stringify(context)};
    const handler = ${handlerCode};
    return JSON.stringify(handler(params, context));
  `;
  const fn = new Function(wrappedCode);
  const result = fn();
  return typeof result === 'string' ? JSON.parse(result) : result;
}

/** Execute sandboxed JS code */
async function executeSandboxedCode(
  code: string,
  context: Record<string, unknown>,
  timeout: number,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Code execution timed out')), timeout);

    try {
      const wrappedCode = `
        const context = ${JSON.stringify(context)};
        ${code}
      `;
      const fn = new Function('context', wrappedCode);
      fn(context);
      clearTimeout(timer);
      resolve({ ...context });
    } catch (err: any) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// --- Public API ---

/** Start executing a workflow */
export async function startExecution(
  workflowId: string,
  inputs: Record<string, unknown>,
): Promise<WorkflowExecution> {
  const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as any;
  if (!row) {
    throw new Error(`Workflow "${workflowId}" not found`);
  }

  const definition: WorkflowDefinition = JSON.parse(row.definition);
  const executionId = uuid();
  const now = new Date().toISOString();

  const execution: WorkflowExecution = {
    executionId,
    workflowId,
    status: 'running',
    nodeResults: {},
    startedAt: now,
  };

  runningExecutions.set(executionId, execution);

  // Persist execution record
  db.prepare(`
    INSERT INTO executions (execution_id, workflow_id, status, node_results, started_at)
    VALUES (?, ?, 'running', '{}', ?)
  `).run(executionId, workflowId, now);

  wsManager.sendToExecution(executionId, {
    type: 'execution:started',
    execution,
  });

  // Run workflow asynchronously
  runWorkflow(executionId, definition, inputs).catch((err) => {
    console.error(`[Engine] Workflow execution error:`, err);
  });

  return execution;
}

/** Core workflow execution loop - condition-aware graph traversal */
async function runWorkflow(
  executionId: string,
  definition: WorkflowDefinition,
  inputs: Record<string, unknown>,
): Promise<void> {
  const execution = runningExecutions.get(executionId);
  if (!execution) return;

  const { nodes, edges } = definition;

  // Find start node
  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) {
    failExecution(executionId, 'No start node found in workflow');
    return;
  }

  // Build adjacency: nodeId -> target nodeIds (ordered)
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    const targets = adjacency.get(edge.source) || [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
  }

  // Node lookup
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Context carries data between nodes
  let context: Record<string, unknown> = { ...inputs };

  // BFS-style traversal with condition awareness
  const visited = new Set<string>();
  const queue: string[] = [startNode.id];

  while (queue.length > 0) {
    if (execution.status !== 'running') break;

    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) continue;

    execution.currentNodeId = nodeId;

    const result = await executeNode(node, context, executionId);
    execution.nodeResults[nodeId] = result;

    if (result.status === 'error') {
      failExecution(executionId, `Node "${nodeId}" failed: ${result.error}`);
      return;
    }

    // Update context with node output (for non-condition nodes)
    if (node.type !== 'condition') {
      context = { ...context, ...result.output };
    }

    // Determine next nodes based on node type
    if (node.type === 'condition') {
      // Condition: route to trueBranch or falseBranch
      const condConfig = node.data.config as ConditionConfig;
      const branch = result.output.nextBranch as string;
      const nextId = branch === 'true' ? condConfig.trueBranch : condConfig.falseBranch;

      if (nextId && !visited.has(nextId)) {
        queue.push(nextId);
      }

      // Mark the non-taken branch nodes as skipped
      const skippedBranch = branch === 'true' ? condConfig.falseBranch : condConfig.trueBranch;
      if (skippedBranch) {
        markBranchSkipped(skippedBranch, nodeMap, adjacency, visited, execution);
      }
    } else if (node.type === 'end') {
      // End node: stop traversal
      continue;
    } else {
      // Normal node: follow all outgoing edges
      const targets = adjacency.get(nodeId) || [];
      for (const targetId of targets) {
        if (!visited.has(targetId)) {
          queue.push(targetId);
        }
      }
    }
  }

  // Mark any remaining unvisited nodes as skipped
  for (const node of nodes) {
    if (!visited.has(node.id) && !execution.nodeResults[node.id]) {
      execution.nodeResults[node.id] = {
        nodeId: node.id,
        status: 'skipped',
        input: {},
        output: {},
        startedAt: new Date().toISOString(),
      };
    }
  }

  // Complete execution
  completeExecution(executionId);
}

/** Recursively mark all nodes in a branch as skipped */
function markBranchSkipped(
  startNodeId: string,
  nodeMap: Map<string, WorkflowNode>,
  adjacency: Map<string, string[]>,
  visited: Set<string>,
  execution: WorkflowExecution,
): void {
  const stack = [startNodeId];
  const markedLocal = new Set<string>();

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id) || markedLocal.has(id)) continue;
    markedLocal.add(id);
    visited.add(id); // Mark as visited so main loop skips it

    const node = nodeMap.get(id);
    if (!node || node.type === 'end') continue;

    execution.nodeResults[id] = {
      nodeId: id,
      status: 'skipped',
      input: {},
      output: {},
      startedAt: new Date().toISOString(),
    };

    // Continue to child nodes
    const targets = adjacency.get(id) || [];
    for (const targetId of targets) {
      stack.push(targetId);
    }
  }
}

function completeExecution(executionId: string): void {
  const execution = runningExecutions.get(executionId);
  if (!execution) return;

  execution.status = 'completed';
  execution.finishedAt = new Date().toISOString();

  db.prepare(`
    UPDATE executions SET status = 'completed', node_results = ?, finished_at = ?
    WHERE execution_id = ?
  `).run(JSON.stringify(execution.nodeResults), execution.finishedAt, executionId);

  wsManager.sendToExecution(executionId, {
    type: 'execution:completed',
    execution,
  });

  runningExecutions.delete(executionId);
}

function failExecution(executionId: string, error: string): void {
  const execution = runningExecutions.get(executionId);
  if (!execution) return;

  execution.status = 'failed';
  execution.error = error;
  execution.finishedAt = new Date().toISOString();

  db.prepare(`
    UPDATE executions SET status = 'failed', node_results = ?, error = ?, finished_at = ?
    WHERE execution_id = ?
  `).run(JSON.stringify(execution.nodeResults), error, execution.finishedAt, executionId);

  wsManager.sendToExecution(executionId, {
    type: 'execution:failed',
    execution,
  });

  runningExecutions.delete(executionId);
}

/** Cancel a running execution */
export function cancelExecution(executionId: string): boolean {
  const execution = runningExecutions.get(executionId);
  if (!execution || execution.status !== 'running') return false;

  execution.status = 'cancelled';
  execution.finishedAt = new Date().toISOString();

  db.prepare(`
    UPDATE executions SET status = 'cancelled', node_results = ?, finished_at = ?
    WHERE execution_id = ?
  `).run(JSON.stringify(execution.nodeResults), execution.finishedAt, executionId);

  wsManager.sendToExecution(executionId, {
    type: 'execution:completed',
    execution,
  });

  runningExecutions.delete(executionId);
  return true;
}

/** Get execution status */
export function getExecution(executionId: string): WorkflowExecution | undefined {
  return runningExecutions.get(executionId)
    || (db.prepare('SELECT * FROM executions WHERE execution_id = ?').get(executionId) as any);
}

/** Retry a failed node */
export async function retryNode(executionId: string, nodeId: string): Promise<boolean> {
  const execution = runningExecutions.get(executionId);
  if (!execution) return false;

  const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(execution.workflowId) as any;
  if (!row) return false;

  const definition: WorkflowDefinition = JSON.parse(row.definition);
  const node = definition.nodes.find((n) => n.id === nodeId);
  if (!node) return false;

  // Collect context from preceding nodes
  const context = collectNodeContext(execution, definition);

  const result = await executeNode(node, context, executionId);
  execution.nodeResults[nodeId] = result;

  return result.status === 'success';
}

function collectNodeContext(
  execution: WorkflowExecution,
  _definition: WorkflowDefinition,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  const executed = Object.values(execution.nodeResults).filter(
    (r) => r.status === 'success'
  );
  // Merge outputs from all successfully executed nodes
  for (const result of executed) {
    Object.assign(context, result.output);
  }
  return context;
}
