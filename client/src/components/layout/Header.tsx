import { Save, Play, Monitor, Wrench, History } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useToastStore } from '../../stores/toastStore';
import { api } from '../../lib/api';

type RightPanel = 'monitor' | 'tools' | 'history' | null;

interface HeaderProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  rightPanel: RightPanel;
  onTogglePanel: (panel: RightPanel) => void;
}

export default function Header({ workflowName, onNameChange, rightPanel, onTogglePanel }: HeaderProps) {
  const { workflow, isDirty, nodes, edges, setWorkflow, markClean, setShowWorkflowList } = useWorkflowStore();
  const { startExecution } = useWebSocket();
  const addToast = useToastStore((s) => s.addToast);

  const handleRun = async () => {
    let wfId = workflow?.id;
    if (!wfId || isDirty) {
      try {
        const payload = {
          name: workflowName || 'Untitled',
          description: workflow?.description || '',
          definition: { nodes, edges, variables: workflow?.variables || {} },
        };
        if (wfId) {
          await api.updateWorkflow(wfId, payload);
        } else {
          const created = await api.createWorkflow(payload);
          wfId = created.id;
          setWorkflow({ ...created });
        }
        markClean();
        addToast('success', 'Workflow saved');
      } catch (err: any) {
        addToast('error', `Save failed: ${err.message}`);
        return;
      }
    }

    const inputs: Record<string, unknown> = {};
    const startNode = nodes.find((n: any) => n.type === 'start');
    if (startNode?.data?.config && 'inputSchema' in startNode.data.config) {
      for (const key of Object.keys((startNode.data.config as any).inputSchema)) {
        inputs[key] = prompt(`Enter value for "${key}":`) || '';
      }
    }

    startExecution(wfId!, inputs);
    addToast('info', 'Execution started — check Monitor panel');
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
          onClick={() => setShowWorkflowList(true)}
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

      <button
        onClick={() => onTogglePanel('history')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
          rightPanel === 'history'
            ? 'bg-primary-600/20 text-primary-400'
            : 'hover:bg-surface-700 text-surface-300 hover:text-white'
        }`}
      >
        <History size={15} />
        <span>History</span>
      </button>
    </header>
  );
}
