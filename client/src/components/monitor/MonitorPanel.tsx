import { useEffect, useRef } from 'react';
import { Monitor, Circle, AlertCircle, CheckCircle2, Clock, Loader2, RotateCcw, Square } from 'lucide-react';
import { useExecutionStore } from '../../stores/executionStore';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function MonitorPanel() {
  const { activeExecutionId, executions, logs } = useExecutionStore();
  const { subscribeExecution, retryNode, cancelExecution } = useWebSocket();
  const logEndRef = useRef<HTMLDivElement>(null);

  const execution = activeExecutionId ? executions.get(activeExecutionId) : null;

  useEffect(() => {
    if (activeExecutionId) {
      subscribeExecution(activeExecutionId);
    }
  }, [activeExecutionId, subscribeExecution]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const nodeResults = execution ? Object.values(execution.nodeResults) : [];
  const completedCount = nodeResults.filter((r) => r.status === 'success').length;
  const errorCount = nodeResults.filter((r) => r.status === 'error').length;
  const skippedCount = nodeResults.filter((r) => r.status === 'skipped').length;

  const handleRetry = (nodeId: string) => {
    if (!activeExecutionId) return;
    retryNode(activeExecutionId, nodeId);
  };

  const handleCancel = () => {
    if (!activeExecutionId) return;
    cancelExecution(activeExecutionId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Monitor size={15} className="text-primary-400" />
            Execution Monitor
          </h3>
          {execution && execution.status === 'running' && (
            <button
              onClick={handleCancel}
              className="p-1.5 rounded hover:bg-red-600/20 text-surface-400 hover:text-red-400 transition-colors"
              title="Cancel execution"
            >
              <Square size={14} />
            </button>
          )}
        </div>

        {execution && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={execution.status} />
              <span className="text-xs text-surface-400">
                {new Date(execution.startedAt).toLocaleTimeString()}
              </span>
              {execution.finishedAt && (
                <span className="text-xs text-surface-500">
                  · {(new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000}s
                </span>
              )}
            </div>

            {/* Progress bar */}
            {nodeResults.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1.5">
                  {nodeResults.map((r) => (
                    <div
                      key={r.nodeId}
                      className="flex-1 rounded-full transition-colors duration-300"
                      style={{
                        backgroundColor:
                          r.status === 'success' ? '#22c55e' :
                          r.status === 'error' ? '#ef4444' :
                          r.status === 'running' ? '#3b82f6' :
                          r.status === 'skipped' ? '#6b7280' :
                          '#334155',
                      }}
                      title={`${r.nodeId.slice(0, 8)}: ${r.status}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-surface-500">
                  <span className="text-green-400">✓ {completedCount}</span>
                  <span className="text-red-400">✗ {errorCount}</span>
                  <span className="text-gray-500">⊘ {skippedCount}</span>
                  <span className="text-surface-400">{nodeResults.length} nodes</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!execution && (
          <p className="text-xs text-surface-500 mt-2">
            Run a workflow to see live execution status here.
          </p>
        )}
      </div>

      {/* Node Status with retry */}
      {nodeResults.length > 0 && (
        <div className="p-4 border-b border-surface-700">
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Nodes</h4>
          <div className="space-y-1">
            {nodeResults.map((result) => (
              <div
                key={result.nodeId}
                className="flex items-center gap-2 text-xs py-1 group"
              >
                {result.status === 'running' && <Loader2 size={14} className="text-blue-400 animate-spin shrink-0" />}
                {result.status === 'success' && <CheckCircle2 size={14} className="text-green-400 shrink-0" />}
                {result.status === 'error' && <AlertCircle size={14} className="text-red-400 shrink-0" />}
                {result.status === 'skipped' && <Circle size={14} className="text-gray-600 shrink-0" />}
                {result.status === 'pending' && <Clock size={14} className="text-surface-500 shrink-0" />}

                <span className="text-surface-300 font-mono text-[11px] truncate max-w-[100px]">
                  {result.nodeId.slice(0, 8)}
                </span>

                {result.status === 'error' && result.error && (
                  <span className="text-red-400/70 truncate text-[10px] max-w-[120px]" title={result.error}>
                    {result.error}
                  </span>
                )}

                <span className={`ml-auto text-[10px] ${
                  result.status === 'error' ? 'text-red-400' : 'text-surface-500'
                }`}>
                  {result.duration ? `${result.duration}ms` : ''}
                </span>

                {/* Retry button for failed nodes */}
                {result.status === 'error' && execution?.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(result.nodeId)}
                    className="p-1 rounded hover:bg-amber-600/20 text-surface-500 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Retry this node"
                  >
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-surface-700 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-surface-400 uppercase">Logs</h4>
          <span className="text-xs text-surface-500">{logs.length} entries</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {logs.length === 0 ? (
            <p className="text-xs text-surface-500 text-center py-8">
              No logs yet. Execution output will appear here.
            </p>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <span className="text-[10px] text-surface-500 font-mono shrink-0 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs ${
                      log.level === 'error'
                        ? 'text-red-400'
                        : log.level === 'warn'
                        ? 'text-amber-400'
                        : 'text-surface-300'
                    }`}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-surface-600 text-surface-300',
    running: 'bg-blue-600/20 text-blue-400 border border-blue-500/30',
    completed: 'bg-green-600/20 text-green-400 border border-green-500/30',
    failed: 'bg-red-600/20 text-red-400 border border-red-500/30',
    cancelled: 'bg-amber-600/20 text-amber-400 border border-amber-500/30',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${colors[status] || ''}`}>
      {status}
    </span>
  );
}
