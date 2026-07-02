import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Code2 } from 'lucide-react';
import type { CodeExecConfig } from '@visagent/shared';

function CodeExecNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as Record<string, any>;
  const config = data.config as CodeExecConfig;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] ${
        selected ? 'border-primary-400' : 'border-cyan-600'
      } bg-surface-800 shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-cyan-500" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center">
          <Code2 size={12} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="text-xs text-surface-400">
          Lang: <span className="text-cyan-400">{config?.language || 'js'}</span>
        </div>
        <div className="text-xs text-surface-500 font-mono truncate max-w-[160px]">
          {config?.code?.slice(0, 50) || 'No code'}...
        </div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs font-medium ${statusColor(data.status)}`}>
          ● {data.status.toUpperCase()}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500" />
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'running': return 'text-blue-400';
    case 'success': return 'text-green-400';
    case 'error': return 'text-red-400';
    case 'skipped': return 'text-gray-500';
    default: return 'text-surface-500';
  }
}

export default memo(CodeExecNode);
