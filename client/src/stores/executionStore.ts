import { create } from 'zustand';
import type { WorkflowExecution, NodeExecutionResult } from '@visagent/shared';

interface ExecutionState {
  executions: Map<string, WorkflowExecution>;
  activeExecutionId: string | null;
  logs: Array<{ timestamp: string; level: string; message: string }>;

  setActiveExecution: (executionId: string | null) => void;
  updateExecution: (executionId: string, updates: Partial<WorkflowExecution>) => void;
  updateNodeResult: (executionId: string, result: NodeExecutionResult) => void;
  addLog: (log: { timestamp: string; level: string; message: string }) => void;
  clearLogs: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  executions: new Map(),
  activeExecutionId: null,
  logs: [],

  setActiveExecution: (executionId) => set({ activeExecutionId: executionId, logs: [] }),

  updateExecution: (executionId, updates) =>
    set((state) => {
      const executions = new Map(state.executions);
      const existing = executions.get(executionId);
      if (existing) {
        executions.set(executionId, { ...existing, ...updates });
      } else {
        executions.set(executionId, updates as WorkflowExecution);
      }
      return { executions };
    }),

  updateNodeResult: (executionId, result) =>
    set((state) => {
      const executions = new Map(state.executions);
      const existing = executions.get(executionId);
      if (existing) {
        executions.set(executionId, {
          ...existing,
          nodeResults: { ...existing.nodeResults, [result.nodeId]: result },
          currentNodeId: result.nodeId,
        });
      }
      return { executions };
    }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs.slice(-200), log], // Keep last 200 logs
    })),

  clearLogs: () => set({ logs: [] }),
}));
