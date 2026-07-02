import { create } from 'zustand';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@visagent/shared';

interface WorkflowState {
  workflow: WorkflowDefinition | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  isDirty: boolean;
  workflowList: Array<{ id: string; name: string; updatedAt: string }>;
  showWorkflowList: boolean;

  // Actions
  setWorkflow: (wf: WorkflowDefinition) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (id: string, data: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  reset: () => void;
  setWorkflowList: (list: Array<{ id: string; name: string; updatedAt: string }>) => void;
  setShowWorkflowList: (show: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflow: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDirty: false,
  workflowList: [],
  showWorkflowList: false,

  setWorkflow: (wf) =>
    set({ workflow: wf, nodes: wf.nodes, edges: wf.edges, isDirty: false }),

  setNodes: (nodes) => set({ nodes, isDirty: true }),

  setEdges: (edges) => set({ edges, isDirty: true }),

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node], isDirty: true })),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
      isDirty: true,
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      isDirty: true,
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  reset: () =>
    set({
      workflow: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
    }),

  setWorkflowList: (list) => set({ workflowList: list }),
  setShowWorkflowList: (show) => set({ showWorkflowList: show }),
}));
