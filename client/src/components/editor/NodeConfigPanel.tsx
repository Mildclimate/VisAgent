import { X, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import type { LLMCallConfig, ToolExecConfig, ConditionConfig, CodeExecConfig } from '@visagent/shared';

export default function NodeConfigPanel() {
  const { nodes, selectedNodeId, selectNode, updateNode, deleteNode } = useWorkflowStore();

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const handleConfigChange = (field: string, value: unknown) => {
    updateNode(node.id, {
      data: {
        ...node.data,
        config: { ...node.data.config, [field]: value },
      },
    });
  };

  const handleLabelChange = (label: string) => {
    updateNode(node.id, {
      data: { ...node.data, label },
    });
  };

  const renderConfigFields = () => {
    switch (node.type) {
      case 'llm-call': {
        const config = node.data.config as LLMCallConfig;
        return (
          <div className="space-y-3">
            <Field label="Model" value={config.model} onChange={(v) => handleConfigChange('model', v)} />
            <Field
              label="Temperature"
              type="number"
              value={String(config.temperature)}
              onChange={(v) => handleConfigChange('temperature', parseFloat(v))}
            />
            <Field
              label="Max Tokens"
              type="number"
              value={String(config.maxTokens)}
              onChange={(v) => handleConfigChange('maxTokens', parseInt(v))}
            />
            <div className="space-y-1">
              <label className="text-xs text-surface-400">System Prompt</label>
              <textarea
                className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white resize-y min-h-[80px]"
                value={config.systemPrompt}
                onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-surface-400">User Prompt Template</label>
              <textarea
                className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white resize-y min-h-[60px]"
                value={config.userPromptTemplate}
                onChange={(e) => handleConfigChange('userPromptTemplate', e.target.value)}
                placeholder="Use {{variable}} for template interpolation"
              />
            </div>
          </div>
        );
      }

      case 'tool-exec': {
        const config = node.data.config as ToolExecConfig;
        return (
          <div className="space-y-3">
            <Field label="Tool Name" value={config.toolName} onChange={(v) => handleConfigChange('toolName', v)} />
            <div className="text-xs text-surface-500">
              Parameters and injections configured in advanced view.
            </div>
          </div>
        );
      }

      case 'condition': {
        const config = node.data.config as ConditionConfig;
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-surface-400">Condition Expression</label>
              <textarea
                className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white font-mono"
                value={config.expression}
                onChange={(e) => handleConfigChange('expression', e.target.value)}
                placeholder="ctx.value > 0"
                rows={2}
              />
            </div>
          </div>
        );
      }

      case 'code-exec': {
        const config = node.data.config as CodeExecConfig;
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-surface-400">Language</label>
              <select
                className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white"
                value={config.language}
                onChange={(e) => handleConfigChange('language', e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python (coming soon)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-surface-400">Code</label>
              <textarea
                className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white font-mono resize-y min-h-[100px]"
                value={config.code}
                onChange={(e) => handleConfigChange('code', e.target.value)}
              />
            </div>
            <Field
              label="Timeout (ms)"
              type="number"
              value={String(config.timeout)}
              onChange={(v) => handleConfigChange('timeout', parseInt(v))}
            />
          </div>
        );
      }

      case 'start': {
        return (
          <div className="space-y-3">
            <div className="text-xs text-surface-400">
              Configure input fields for this workflow. Each field will be prompted when the workflow is started.
            </div>
            {/* Input schema fields */}
            <div className="space-y-2">
              {Object.entries((node.data.config as any).inputSchema || {}).map(([key, type]) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    className="flex-1 bg-surface-900 border border-surface-600 rounded px-2 py-1 text-sm text-white"
                    value={key}
                    readOnly
                  />
                  <span className="text-xs text-surface-500">{type as string}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return <p className="text-sm text-surface-500">No configurable fields for this node type.</p>;
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 max-h-[80vh] bg-surface-800 border border-surface-600 rounded-lg shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700 bg-surface-700/50">
        <div>
          <input
            className="bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent hover:border-surface-500 focus:border-primary-500 w-full"
            value={node.data.label}
            onChange={(e) => handleLabelChange(e.target.value)}
          />
          <div className="text-xs text-surface-400 mt-0.5 capitalize">{node.type}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => deleteNode(node.id)}
            className="p-1.5 rounded hover:bg-red-600/20 text-surface-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => selectNode(null)}
            className="p-1.5 rounded hover:bg-surface-600 text-surface-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Config fields */}
      <div className="p-4 overflow-y-auto">
        {renderConfigFields()}
      </div>
    </div>
  );
}

/** Simple text field */
function Field({
  label,
  value,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-surface-400">{label}</label>
      <input
        type={type}
        className="w-full bg-surface-900 border border-surface-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
