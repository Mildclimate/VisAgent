import { useCallback, useRef, useState, useEffect, DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import { Undo2, Redo2 } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { nodeTypes } from './nodes/nodeTypes';
import NodeConfigPanel from './NodeConfigPanel';

function generateId(): string {
  return crypto.randomUUID();
}

interface Snapshot {
  nodes: Node[];
  edges: Edge[];
}

export default function WorkflowEditor() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
    selectedNodeId,
    selectNode,
  } = useWorkflowStore();

  const [nodes, setNodesLocal, onNodesChange] = useNodesState(storeNodes as unknown as Node[]);
  const [edges, setEdgesLocal, onEdgesChange] = useEdgesState(storeEdges as Edge[]);

  // Undo/Redo history
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyInitialized = useRef(false);

  // Initialize history with current state
  useEffect(() => {
    if (!historyInitialized.current && nodes.length >= 0) {
      setHistory([{ nodes: [...nodes], edges: [...edges] }]);
      setHistoryIndex(0);
      historyInitialized.current = true;
    }
  }, []);

  const pushHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed.slice(-49), { nodes: [...newNodes], edges: [...newEdges] }];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Sync local state to store AND push history
  const syncToStore = useCallback(
    (updatedNodes: Node[], updatedEdges: Edge[], recordHistory = true) => {
      setNodesLocal(updatedNodes);
      setEdgesLocal(updatedEdges);
      setNodes(updatedNodes as any);
      setEdges(updatedEdges as any);
      if (recordHistory) {
        pushHistory(updatedNodes, updatedEdges);
      }
    },
    [setNodes, setEdges, pushHistory],
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setHistoryIndex(historyIndex - 1);
    syncToStore(prev.nodes, prev.edges, false);
  }, [history, historyIndex, syncToStore]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setHistoryIndex(historyIndex + 1);
    syncToStore(next.nodes, next.edges, false);
  }, [history, historyIndex, syncToStore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Delete key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        // Handled by store's deleteNode
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedNodeId]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: generateId(),
        type: 'smoothstep',
      } as Edge;
      const updatedEdges = addEdge(newEdge, edges);
      syncToStore(nodes, updatedEdges);
    },
    [nodes, edges, syncToStore],
  );

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange],
  );

  // Handle drop from sidebar
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/visagent-node');
      if (!rawData || !reactFlowWrapper.current) return;

      const template = JSON.parse(rawData);
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();

      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode: Node = {
        id: generateId(),
        type: template.type,
        position,
        data: { ...template.defaultData },
      };

      const updatedNodes = [...nodes, newNode];
      syncToStore(updatedNodes, edges);
    },
    [nodes, edges, syncToStore],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Track node drag end for history
  const onNodeDragStop = useCallback(() => {
    pushHistory(nodes, edges);
  }, [nodes, edges, pushHistory]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full relative">
      {/* Undo/Redo toolbar */}
      <div className="absolute top-3 left-3 z-10 flex gap-1">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-2 rounded-md bg-surface-800 border border-surface-600 text-surface-300 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="p-2 rounded-md bg-surface-800 border border-surface-600 text-surface-300 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={15} />
        </button>
      </div>

      {/* Empty state hint */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-center">
            <p className="text-surface-400 text-lg font-medium mb-2">Drop a node to get started</p>
            <p className="text-surface-600 text-sm">
              Drag nodes from the left palette onto this canvas
            </p>
            <div className="mt-4 flex justify-center gap-4 text-[11px] text-surface-600">
              <span><kbd className="px-1.5 py-0.5 rounded bg-surface-700 text-surface-400 text-[10px]">Ctrl+Z</kbd> Undo</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-surface-700 text-surface-400 text-[10px]">Ctrl+Shift+Z</kbd> Redo</span>
              <span><kbd className="px-1.5 py-0.5 rounded bg-surface-700 text-surface-400 text-[10px]">Del</kbd> Delete</span>
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={['Backspace', 'Delete']}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#64748b', strokeWidth: 2 },
        }}
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="!bg-surface-800 !border-surface-700 !fill-surface-300" />
        <MiniMap
          nodeStrokeWidth={3}
          className="!bg-surface-800 !border-surface-700"
          maskColor="rgba(15, 23, 42, 0.7)"
        />
      </ReactFlow>

      {/* Node configuration panel */}
      {selectedNodeId && (
        <NodeConfigPanel />
      )}
    </div>
  );
}
