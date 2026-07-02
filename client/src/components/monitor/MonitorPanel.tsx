import { useEffect, useRef } from 'react';
import { Monitor, Circle, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useExecutionStore } from '../../stores/executionStore';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function MonitorPanel() {
  const { activeExecutionId, executions, logs } = useExecutionStore();
  const { subscribeExecution } = useWebSocket();
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-700">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Monitor size={15} className="text-primary-400" />
          Execution Monitor
        </h3>

        {execution && (
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={execution.status} />
            <span className="text-xs text-surface-400">
              {new Date(execution.startedAt).toLocaleTimeString()}
            </span>
          </div>
        )}

        {!execution && (
          <p className="text-xs text-surface-500 mt-2">
            Run a workflow to see live execution status here.
          </p>
        )}
      </div>

      {/* Node Status */}
      {nodeResults.length > 0 && (
        <div className="p-4 border-b border-surface-700">
          <h4 className="text-xs font-semibold text-surface-400 uppercase mb-2">Node Status</h4>
          <div className="space-y-1.5">
            {nodeResults.map((result) => (
              <div
                key={result.nodeId}
                className="flex items-center gap-2 text-xs py-1"
              >
                {result.status === 'running' && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                {result.status === 'success' && <CheckCircle2 size={14} className="text-green-400" />}
                {result.status === 'error' && <AlertCircle size={14} className="text-red-400" />}
                {result.status === 'skipped' && <Circle size={14} className="text-gray-600" />}
                {result.status === 'pending' && <Clock size={14} className="text-surface-500" />}

                <span className="text-surface-300 font-mono text-[11px] truncate max-w-[120px]">
                  {result.nodeId.slice(0, 8)}
                </span>

                <span className={`ml-auto ${
                  result.status === 'error' ? 'text-red-400' : 'text-surface-500'
                }`}>
                  {result.duration ? `${result.duration}ms` : ''}
                </span>
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
    running: 'bg-blue-600/20 text-blue-400',
    completed: 'bg-green-600/20 text-green-400',
    failed: 'bg-red-600/20 text-red-400',
    cancelled: 'bg-amber-600/20 text-amber-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${colors[status] || ''}`}>
      {status}
    </span>
  );
}
