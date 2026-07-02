import { Save, Play, Monitor, Wrench } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWebSocket } from '../../hooks/useWebSocket';

type RightPanel = 'monitor' | 'tools' | null;

interface HeaderProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  rightPanel: RightPanel;
  onTogglePanel: (panel: RightPanel) => void;
}

export default function Header({ workflowName, onNameChange, rightPanel, onTogglePanel }: HeaderProps) {
  const { workflow, isDirty } = useWorkflowStore();
  const { startExecution } = useWebSocket();

  const handleRun = () => {
    if (!workflow) return;
    const inputs: Record<string, unknown> = {};
    // Collect input from start node config
    const startNode = workflow.nodes.find((n) => n.type === 'start');
    if (startNode?.data.config && 'inputSchema' in startNode.data.config) {
      for (const key of Object.keys(startNode.data.config.inputSchema)) {
        inputs[key] = prompt(`Enter value for "${key}":`) || '';
      }
    }

    startExecution(workflow.id, inputs);
  };

  return (
    <header className="h-12 bg-surface-800 border-b border-surface-700 flex items-center px-4 gap-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded bg-primary-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">VA</span>
        </div>
        <span className="font-semibold text-sm text-white">VisAgent</span>
      </div>

      {/* Workflow name */}
      <input
        type="text"
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        className="bg-transparent text-sm font-medium text-white border border-transparent hover:border-surface-600 focus:border-primary-500 rounded px-2 py-1 outline-none w-48"
      />

      {isDirty && (
        <span className="text-xs text-amber-400">● Unsaved</span>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => {/* TODO: save */}}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
        >
          <Save size={15} />
          <span>Save</span>
        </button>

        <button
          onClick={handleRun}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
        >
          <Play size={15} />
          <span>Run</span>
        </button>
      </div>

      <div className="w-px h-6 bg-surface-700 mx-1" />

      {/* Right panel toggles */}
      <button
        onClick={() => onTogglePanel('monitor')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
          rightPanel === 'monitor'
            ? 'bg-primary-600/20 text-primary-400'
            : 'hover:bg-surface-700 text-surface-300 hover:text-white'
        }`}
      >
        <Monitor size={15} />
        <span>Monitor</span>
      </button>

      <button
        onClick={() => onTogglePanel('tools')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
          rightPanel === 'tools'
            ? 'bg-primary-600/20 text-primary-400'
            : 'hover:bg-surface-700 text-surface-300 hover:text-white'
        }`}
      >
        <Wrench size={15} />
        <span>Tools</span>
      </button>
    </header>
  );
}
