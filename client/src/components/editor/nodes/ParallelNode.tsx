import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitFork } from 'lucide-react';
import type { ParallelConfig } from '@visagent/shared';

function ParallelNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as Record<string, any>;
  const config = data.config as ParallelConfig;

  const branchCount = config?.branches ? Object.keys(config.branches).length : 0;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[180px] ${
        selected ? 'border-primary-400' : 'border-pink-600'
      } bg-surface-800 shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-pink-500" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-pink-600 flex items-center justify-center">
          <GitFork size={12} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="text-xs text-surface-400">
          Branches: <span className="text-pink-400">{branchCount || 0}</span>
        </div>
        <div className="text-xs text-surface-400">
          Strategy: <span className="text-pink-400">{config?.strategy || 'all'}</span>
        </div>
      </div>
      {data.status && (
        <div className={`mt-2 text-xs font-medium ${statusColor(data.status)}`}>
          ● {data.status.toUpperCase()}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-pink-500" />
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

export default memo(ParallelNode);
