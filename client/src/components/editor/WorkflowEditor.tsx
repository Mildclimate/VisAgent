import { useCallback, useRef, DragEvent } from 'react';
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
import { useWorkflowStore } from '../../stores/workflowStore';

function generateId(): string {
  return crypto.randomUUID();
}
import { nodeTypes } from './nodes/nodeTypes';
import NodeConfigPanel from './NodeConfigPanel';

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

  // Sync local state to store
  const syncToStore = useCallback(
    (updatedNodes: Node[], updatedEdges: Edge[]) => {
      setNodesLocal(updatedNodes);
      setEdgesLocal(updatedEdges);
      setNodes(updatedNodes as any);
      setEdges(updatedEdges as any);
    },
    [setNodes, setEdges],
  );

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
      // Sync after a brief delay to let ReactFlow update
      setTimeout(() => {
        // We need to get the latest nodes from DOM/state
      }, 0);
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

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
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
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
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
