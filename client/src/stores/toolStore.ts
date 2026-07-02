import { create } from 'zustand';
import type { ToolDefinition } from '@visagent/shared';

interface ToolState {
  tools: ToolDefinition[];
  selectedTool: ToolDefinition | null;
  loading: boolean;

  setTools: (tools: ToolDefinition[]) => void;
  selectTool: (tool: ToolDefinition | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  tools: [],
  selectedTool: null,
  loading: false,

  setTools: (tools) => set({ tools }),
  selectTool: (tool) => set({ selectedTool: tool }),
  setLoading: (loading) => set({ loading }),
}));
