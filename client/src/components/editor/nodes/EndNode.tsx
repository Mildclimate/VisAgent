import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ArrowRight } from 'lucide-react';

function EndNode({ data: rawData, selected }: NodeProps) {
  const data = rawData as Record<string, any>;
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 min-w-[160px] ${
        selected ? 'border-primary-400' : 'border-red-600'
      } bg-surface-800 shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-red-500" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
          <ArrowRight size={12} className="text-white" />
        </div>
        <span className="text-sm font-medium text-white">{data.label}</span>
      </div>
      {data.description && (
        <p className="text-xs text-surface-400 mt-1">{data.description}</p>
      )}
    </div>
  );
}

export default memo(EndNode);
