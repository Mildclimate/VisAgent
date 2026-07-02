import type { NodeTypes } from '@xyflow/react';
import StartNode from './StartNode';
import EndNode from './EndNode';
import LLMCallNode from './LLMCallNode';
import ToolExecNode from './ToolExecNode';
import ConditionNode from './ConditionNode';
import CodeExecNode from './CodeExecNode';
import LoopNode from './LoopNode';
import ParallelNode from './ParallelNode';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  'llm-call': LLMCallNode,
  'tool-exec': ToolExecNode,
  condition: ConditionNode,
  'code-exec': CodeExecNode,
  loop: LoopNode,
  parallel: ParallelNode,
};
