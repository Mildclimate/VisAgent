import { useEffect, useState } from 'react';
import { History, RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { api } from '../../lib/api';

interface ExecutionRecord {
  execution_id: string;
  workflow_id: string;
  status: string;
  node_results: string;
  started_at: string;
  finished_at: string | null;
  error: string | null;
}

export default function ExecutionHistoryPanel() {
  const { workflow } = useWorkflowStore();
  const [executions, setExecutions] = useState<ExecutionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExec, setSelectedExec] = useState<ExecutionRecord | null>(null);

  const loadHistory = async () => {
    if (!workflow?.id) return;
    setLoading(true);
    try {
      const data = await api.getExecutions(workflow.id);
      setExecutions(data);
    } catch (err) {
      console.error('Failed to load execution history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [workflow?.id]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} className="text-green-400" />;
      case 'failed': return <XCircle size={14} className="text-red-400" />;
      case 'running': return <RefreshCw size={14} className="text-blue-400 animate-spin" />;
      case 'cancelled': return <AlertCircle size={14} className="text-amber-400" />;
      default: return <Clock size={14} className="text-surface-500" />;
    }
  };

  const nodeResults = selectedExec ? (() => {
    try { return JSON.parse(selectedExec.node_results); } catch { return {}; }
  })() : {};

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <History size={15} className="text-primary-400" />
          Execution History
        </h3>
        <button
          onClick={loadHistory}
          className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-white transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {!workflow?.id ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-surface-500 text-center">
            Save and run a workflow to see execution history.
          </p>
        </div>
      ) : executions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-surface-500 text-center">
            No executions yet. Click <span className="text-primary-400">Run</span> to start one.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-surface-700/50">
          {executions.map((exec) => (
            <div key={exec.execution_id}>
              <div
                className={`px-4 py-3 hover:bg-surface-700/30 cursor-pointer transition-colors ${
                  selectedExec?.execution_id === exec.execution_id ? 'bg-primary-600/10 border-l-2 border-primary-500' : ''
                }`}
                onClick={() => setSelectedExec(selectedExec?.execution_id === exec.execution_id ? null : exec)}
              >
                <div className="flex items-center gap-2">
                  {statusIcon(exec.status)}
                  <span className="text-xs text-white font-medium capitalize">{exec.status}</span>
                  <span className="text-[10px] text-surface-500 ml-auto">
                    {new Date(exec.started_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-6">
                  <span className="text-[10px] text-surface-500 font-mono">
                    {exec.execution_id.slice(0, 8)}
                  </span>
                  {exec.finished_at && (
                    <span className="text-[10px] text-surface-500">
                      · {((new Date(exec.finished_at).getTime() - new Date(exec.started_at).getTime()) / 1000).toFixed(1)}s
                    </span>
                  )}
                  {exec.error && (
                    <span className="text-[10px] text-red-400 truncate max-w-[150px]" title={exec.error}>
                      {exec.error.slice(0, 50)}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded node details */}
              {selectedExec?.execution_id === exec.execution_id && (
                <div className="px-6 py-3 bg-surface-800/50 border-t border-surface-700/30">
                  <h4 className="text-[10px] font-semibold text-surface-400 uppercase mb-2">Node Results</h4>
                  {Object.keys(nodeResults).length === 0 ? (
                    <p className="text-xs text-surface-500">No node results available.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {Object.entries(nodeResults).map(([nodeId, result]: [string, any]) => (
                        <div key={nodeId} className="flex items-center gap-2 text-xs">
                          {result.status === 'success' && <CheckCircle2 size={12} className="text-green-400 shrink-0" />}
                          {result.status === 'error' && <XCircle size={12} className="text-red-400 shrink-0" />}
                          {result.status === 'skipped' && <Clock size={12} className="text-gray-500 shrink-0" />}
                          {result.status === 'running' && <RefreshCw size={12} className="text-blue-400 animate-spin shrink-0" />}

                          <span className="text-surface-300 font-mono text-[10px]">
                            {nodeId.slice(0, 8)}
                          </span>
                          <span className={`text-[10px] capitalize ${
                            result.status === 'error' ? 'text-red-400' :
                            result.status === 'success' ? 'text-green-400' : 'text-surface-500'
                          }`}>
                            {result.status}
                          </span>
                          {result.error && (
                            <span className="text-[10px] text-red-400/70 truncate" title={result.error}>
                              {result.error.slice(0, 60)}
                            </span>
                          )}
                          {result.duration && (
                            <span className="text-[10px] text-surface-500 ml-auto">{result.duration}ms</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
