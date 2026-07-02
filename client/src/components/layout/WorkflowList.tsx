import { useEffect } from 'react';
import { X, FileText, Plus, Trash2, Download, Save } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useToastStore } from '../../stores/toastStore';
import { api } from '../../lib/api';

export default function WorkflowList() {
  const {
    workflow,
    workflowList,
    showWorkflowList,
    setShowWorkflowList,
    setWorkflowList,
    setWorkflow,
    nodes,
    edges,
    isDirty,
    markClean,
  } = useWorkflowStore();
  const addToast = useToastStore((s) => s.addToast);

  // Load workflow list when opened
  useEffect(() => {
    if (showWorkflowList) {
      api.getWorkflows().then(setWorkflowList).catch(console.error);
    }
  }, [showWorkflowList]);

  if (!showWorkflowList) return null;

  const handleSave = async () => {
    const name = workflow?.name || prompt('Enter workflow name:') || 'Untitled';
    const payload = {
      name,
      description: workflow?.description || '',
      definition: {
        nodes,
        edges,
        variables: workflow?.variables || {},
      },
    };

    try {
      if (workflow?.id) {
        await api.updateWorkflow(workflow.id, payload);
      } else {
        const created = await api.createWorkflow(payload);
        setWorkflow({ ...created });
      }
      markClean();
      addToast('success', workflow?.id ? 'Workflow updated' : 'Workflow created');
      // Refresh list
      const list = await api.getWorkflows();
      setWorkflowList(list);
    } catch (err: any) {
      addToast('error', `Save failed: ${err.message}`);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const wf = await api.getWorkflow(id);
      setWorkflow(wf);
      setShowWorkflowList(false);
      addToast('info', `Loaded: ${wf.name}`);
    } catch (err: any) {
      addToast('error', `Load failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteWorkflow(id);
      addToast('success', `Deleted: ${name}`);
      const list = await api.getWorkflows();
      setWorkflowList(list);
      if (workflow?.id === id) {
        setWorkflow({ id: '', name: 'Untitled Workflow', version: 1, nodes: [], edges: [], variables: {}, createdAt: '', updatedAt: '' });
      }
    } catch (err: any) {
      addToast('error', `Delete failed: ${err.message}`);
    }
  };

  const handleNew = () => {
    setWorkflow({ id: '', name: 'Untitled Workflow', version: 1, nodes: [], edges: [], variables: {}, createdAt: '', updatedAt: '' });
    setShowWorkflowList(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowWorkflowList(false)}>
      <div
        className="w-[480px] max-h-[70vh] bg-surface-800 border border-surface-600 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <h3 className="text-sm font-semibold text-white">Workflows</h3>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-primary-600 hover:bg-primary-500 text-white transition-colors"
              >
                <Save size={13} />
                Save{workflow?.id ? '' : ' New'}
              </button>
            )}
            <button onClick={handleNew} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white transition-colors">
              <Plus size={16} />
            </button>
            <button onClick={() => setShowWorkflowList(false)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Current workflow info */}
        <div className="px-5 py-3 border-b border-surface-700 bg-surface-700/30">
          <div className="flex items-center gap-2 text-sm">
            <FileText size={14} className="text-primary-400" />
            <span className="text-white font-medium">{workflow?.name || 'Untitled'}</span>
            {workflow?.id && <span className="text-[10px] text-surface-500 font-mono">{workflow.id.slice(0, 8)}</span>}
            {isDirty && <span className="text-[10px] text-amber-400">● Unsaved</span>}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[50vh]">
          {workflowList.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-surface-500">No saved workflows yet.</p>
              <p className="text-xs text-surface-600 mt-1">Click Save to persist the current workflow.</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-700/50">
              {workflowList.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center px-5 py-3 hover:bg-surface-700/30 transition-colors ${
                    workflow?.id === item.id ? 'bg-primary-600/10 border-l-2 border-primary-500' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoad(item.id)}>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-surface-400" />
                      <span className="text-sm text-white truncate">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-surface-500 ml-6 mt-0.5 font-mono">
                      {item.id.slice(0, 8)} · {new Date(item.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleLoad(item.id)}
                      className="p-1.5 rounded hover:bg-surface-600 text-surface-400 hover:text-primary-400 transition-colors"
                      title="Load"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1.5 rounded hover:bg-red-600/20 text-surface-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-700 flex justify-between">
          <span className="text-xs text-surface-500">{workflowList.length} workflow(s)</span>
          <span className="text-xs text-surface-500">Click a workflow to load it</span>
        </div>
      </div>
    </div>
  );
}
