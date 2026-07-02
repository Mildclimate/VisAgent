import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import type { ConditionConfig } from '@visagent/shared';

function ConditionNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as Record<string, any>;
  const config = data.config as ConditionConfig;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] ${
        selected ? 'border-primary-400' : 'border-amber-600'
      } bg-surface-800 shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-500" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded rotate-45 bg-amber-600 flex items-center justify-center">
          <GitBranch size={12} className="text-white -rotate-45" />
        </div>
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      <div className="mt-2">
        <div className="text-xs text-surface-500 font-mono truncate max-w-[160px]">
          {config?.expression || 'No condition'}
        </div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs font-medium ${statusColor(data.status)}`}>
          ● {data.status.toUpperCase()}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-500 !left-[30%]"
        title="True"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-500 !left-[70%]"
        title="False"
      />
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

export default memo(ConditionNode);
