import { useCallback } from 'react';
import {
  Play,
  GitBranch,
  Braces,
  Wrench,
  ArrowRight,
  Code2,
  Repeat,
  GitFork,
} from 'lucide-react';
import type { WorkflowNode, NodeType } from '@visagent/shared';

interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
  defaultData: WorkflowNode['data'];
}

const nodeTemplates: NodeTemplate[] = [
  {
    type: 'start',
    label: 'Start',
    icon: <Play size={16} />,
    color: 'bg-green-600',
    defaultData: {
      label: 'Start',
      description: 'Workflow entry point',
      config: { inputSchema: { query: 'string' } },
    },
  },
  {
    type: 'end',
    label: 'End',
    icon: <ArrowRight size={16} />,
    color: 'bg-red-600',
    defaultData: {
      label: 'End',
      description: 'Workflow exit point',
      config: { outputMapping: {} },
    },
  },
  {
    type: 'llm-call',
    label: 'LLM Call',
    icon: <Braces size={16} />,
    color: 'bg-purple-600',
    defaultData: {
      label: 'LLM Call',
      description: 'Call a language model',
      config: {
        model: 'gpt-4o',
        systemPrompt: 'You are a helpful assistant.',
        userPromptTemplate: '{{query}}',
        temperature: 0.7,
        maxTokens: 4096,
        inputMapping: {},
        enableFunctionCalling: true,
        maxToolCallRounds: 5,
      },
    },
  },
  {
    type: 'tool-exec',
    label: 'Tool Exec',
    icon: <Wrench size={16} />,
    color: 'bg-blue-600',
    defaultData: {
      label: 'Tool Execution',
      description: 'Execute a registered tool',
      config: {
        toolName: '',
        params: {},
        paramInjection: {},
      },
    },
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <GitBranch size={16} />,
    color: 'bg-amber-600',
    defaultData: {
      label: 'Condition',
      description: 'Conditional branch',
      config: {
        expression: 'ctx.value > 0',
        trueBranch: '',
        falseBranch: '',
      },
    },
  },
  {
    type: 'code-exec',
    label: 'Code Exec',
    icon: <Code2 size={16} />,
    color: 'bg-cyan-600',
    defaultData: {
      label: 'Code Execution',
      description: 'Execute custom code',
      config: {
        language: 'javascript',
        code: '// Write your code here\nconsole.log(context);',
        timeout: 30000,
      },
    },
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <Repeat size={16} />,
    color: 'bg-orange-600',
    defaultData: {
      label: 'Loop',
      description: 'Iterate over data',
      config: {
        iterateExpression: 'ctx.items',
        loopBody: [],
        maxIterations: 100,
      },
    },
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: <GitFork size={16} />,
    color: 'bg-pink-600',
    defaultData: {
      label: 'Parallel',
      description: 'Run branches in parallel',
      config: {
        branches: {},
        strategy: 'all',
      },
    },
  },
];

export default function Sidebar() {
  const handleDragStart = useCallback(
    (event: React.DragEvent, template: NodeTemplate) => {
      event.dataTransfer.setData('application/visagent-node', JSON.stringify(template));
      event.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  return (
    <aside className="w-52 bg-surface-800 border-r border-surface-700 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-surface-700">
        <h3 className="text-xs font-semibold text-surface-300 uppercase tracking-wider">
          Node Palette
        </h3>
      </div>

      <div className="flex-1 p-2 space-y-1">
        {nodeTemplates.map((template) => (
          <div
            key={template.type}
            draggable
            onDragStart={(e) => handleDragStart(e, template)}
            className="flex items-center gap-2 px-3 py-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-surface-700 transition-colors text-sm text-surface-200"
          >
            <div className={`w-7 h-7 rounded ${template.color} flex items-center justify-center text-white`}>
              {template.icon}
            </div>
            <span>{template.label}</span>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-surface-700">
        <p className="text-xs text-surface-500">
          Drag nodes onto the canvas to build your workflow.
        </p>
      </div>
    </aside>
  );
}
