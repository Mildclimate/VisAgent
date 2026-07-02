// --- Workflow Graph Types ---

export interface Position {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
}

export type NodeType =
  | 'llm-call'
  | 'tool-exec'
  | 'condition'
  | 'start'
  | 'end'
  | 'loop'
  | 'parallel'
  | 'code-exec';

export interface NodeData {
  label: string;
  description?: string;
  config: NodeConfig;
  /** Runtime status injected during execution */
  status?: NodeExecutionStatus;
}

/** Union of all possible node configurations */
export type NodeConfig =
  | LLMCallConfig
  | ToolExecConfig
  | ConditionConfig
  | StartConfig
  | EndConfig
  | LoopConfig
  | ParallelConfig
  | CodeExecConfig;

export interface LLMCallConfig {
  model: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
  inputMapping: Record<string, string>; // maps input field -> upstream node output field
  /** Enable MCP Function Calling: LLM can autonomously call registered tools */
  enableFunctionCalling?: boolean;
  /** Max rounds of tool calling before forcing a final response */
  maxToolCallRounds?: number;
}

export interface ToolExecConfig {
  toolName: string;
  params: Record<string, unknown>;
  /** Dynamic injection: map param key -> expression or upstream ref */
  paramInjection: Record<string, ParamInjection>;
}

export interface ParamInjection {
  type: 'static' | 'reference' | 'expression';
  value: string; // static value, $ref.nodeId.field, or js expression
}

export interface ConditionConfig {
  expression: string; // JS expression evaluated against context
  trueBranch?: string; // node id for true case
  falseBranch?: string; // node id for false case
}

export interface StartConfig {
  inputSchema: Record<string, string>; // field name -> type
}

export interface EndConfig {
  outputMapping: Record<string, string>; // output field -> source node field
}

export interface LoopConfig {
  /** Expression returning an array to iterate over */
  iterateExpression: string;
  /** Child workflow node IDs (sub-DAG) */
  loopBody: string[];
  /** Max iterations guard */
  maxIterations: number;
}

export interface ParallelConfig {
  /** Pairs of (branch name -> entry node id) */
  branches: Record<string, string>;
  /** Strategy: wait all or race */
  strategy: 'all' | 'race';
}

export interface CodeExecConfig {
  language: 'javascript' | 'python';
  code: string;
  timeout: number; // ms
}

// --- Edge Types ---

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  /** Condition label for branching edges */
  label?: string;
}

// --- Full Workflow Definition ---

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// --- Execution Types ---

export type NodeExecutionStatus = 'idle' | 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface NodeExecutionResult {
  nodeId: string;
  status: NodeExecutionStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  status: ExecutionStatus;
  currentNodeId?: string;
  nodeResults: Record<string, NodeExecutionResult>;
  startedAt: string;
  finishedAt?: string;
  error?: string;
}

// --- WebSocket Event Types ---

export type WsServerEvent =
  | { type: 'execution:started'; execution: WorkflowExecution }
  | { type: 'node:started'; executionId: string; nodeId: string }
  | { type: 'node:completed'; executionId: string; result: NodeExecutionResult }
  | { type: 'node:error'; executionId: string; result: NodeExecutionResult }
  | { type: 'execution:completed'; execution: WorkflowExecution }
  | { type: 'execution:failed'; execution: WorkflowExecution }
  | { type: 'log'; executionId: string; level: 'info' | 'warn' | 'error'; message: string; timestamp: string };

export type WsClientEvent =
  | { type: 'execution:start'; workflowId: string; inputs: Record<string, unknown> }
  | { type: 'execution:pause'; executionId: string }
  | { type: 'execution:resume'; executionId: string }
  | { type: 'execution:cancel'; executionId: string }
  | { type: 'execution:retry'; executionId: string; nodeId: string };
