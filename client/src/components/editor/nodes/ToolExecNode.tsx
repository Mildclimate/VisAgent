import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Wrench } from 'lucide-react';
import type { ToolExecConfig } from '@visagent/shared';

function ToolExecNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as Record<string, any>;
  const config = data.config as ToolExecConfig;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] ${
        selected ? 'border-primary-400' : 'border-blue-600'
      } bg-surface-800 shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
          <Wrench size={12} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      <div className="mt-2">
        <div className="text-xs text-surface-400">
          Tool: <span className="text-blue-400">{config?.toolName || 'Not selected'}</span>
        </div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs font-medium ${statusColor(data.status)}`}>
          ● {data.status.toUpperCase()}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
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

export default memo(ToolExecNode);
