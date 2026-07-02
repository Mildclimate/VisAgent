import type { NodeTypes } from '@xyflow/react';
import StartNode from './StartNode';
import EndNode from './EndNode';
import LLMCallNode from './LLMCallNode';
import ToolExecNode from './ToolExecNode';
import ConditionNode from './ConditionNode';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  'llm-call': LLMCallNode,
  'tool-exec': ToolExecNode,
  condition: ConditionNode,
  // Reuse existing nodes for these types with default rendering
  'code-exec': LLMCallNode,
  loop: LLMCallNode,
  parallel: LLMCallNode,
};
