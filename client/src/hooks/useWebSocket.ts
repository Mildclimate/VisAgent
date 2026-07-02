import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useExecutionStore } from '../stores/executionStore';
import { useWorkflowStore } from '../stores/workflowStore';
import type { WsServerEvent } from '@visagent/shared';

const SOCKET_URL = ''; // Same origin, proxied by Vite

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return globalSocket;
}

export function useWebSocket() {
  const socketRef = useRef<Socket>(getSocket());
  const {
    setActiveExecution,
    updateExecution,
    updateNodeResult,
    addLog,
  } = useExecutionStore();

  /** Sync execution node status to canvas nodes for visual feedback */
  const syncNodeStatus = (nodeId: string, status: string) => {
    const { nodes, updateNode } = useWorkflowStore.getState();
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      updateNode(nodeId, {
        data: { ...node.data, status },
      } as any);
    }
  };

  useEffect(() => {
    const socket = socketRef.current;

    const handleEvent = (event: WsServerEvent) => {
      switch (event.type) {
        case 'execution:started':
          updateExecution(event.execution.executionId, event.execution);
          setActiveExecution(event.execution.executionId);
          // Reset all node statuses to idle
          const { nodes: allNodes, updateNode: updNode } = useWorkflowStore.getState();
          for (const n of allNodes) {
            updNode(n.id, { data: { ...n.data, status: 'idle' } } as any);
          }
          break;

        case 'node:started':
          updateNodeResult(event.executionId, {
            nodeId: event.nodeId,
            status: 'running',
            input: {},
            output: {},
            startedAt: new Date().toISOString(),
          });
          syncNodeStatus(event.nodeId, 'running');
          addLog({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `▶ Node ${event.nodeId.slice(0, 8)} started`,
          });
          break;

        case 'node:completed':
          updateNodeResult(event.executionId, event.result);
          syncNodeStatus(event.result.nodeId, event.result.status);
          addLog({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `✓ Node ${event.result.nodeId.slice(0, 8)} completed in ${event.result.duration}ms`,
          });
          break;

        case 'node:error':
          updateNodeResult(event.executionId, event.result);
          syncNodeStatus(event.result.nodeId, 'error');
          addLog({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `✗ Node ${event.result.nodeId.slice(0, 8)} failed: ${event.result.error}`,
          });
          break;

        case 'execution:completed':
          updateExecution(event.execution.executionId, event.execution);
          addLog({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: '🏁 Workflow execution completed successfully',
          });
          break;

        case 'execution:failed':
          updateExecution(event.execution.executionId, event.execution);
          addLog({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `💥 Workflow execution failed: ${event.execution.error}`,
          });
          break;

        case 'log':
          addLog({
            timestamp: event.timestamp,
            level: event.level,
            message: event.message,
          });
          break;
      }
    };

    // Listen for all event types
    const eventTypes = [
      'execution:started',
      'node:started',
      'node:completed',
      'node:error',
      'execution:completed',
      'execution:failed',
      'log',
    ];

    for (const type of eventTypes) {
      socket.on(type, handleEvent);
    }

    return () => {
      for (const type of eventTypes) {
        socket.off(type, handleEvent);
      }
    };
  }, []);

  const startExecution = useCallback(
    (workflowId: string, inputs: Record<string, unknown>) => {
      const socket = socketRef.current;
      socket.emit('execution:start', { workflowId, inputs });
    },
    [],
  );

  const cancelExecution = useCallback((executionId: string) => {
    const socket = socketRef.current;
    socket.emit('execution:cancel', { executionId });
  }, []);

  const retryNode = useCallback((executionId: string, nodeId: string) => {
    const socket = socketRef.current;
    socket.emit('execution:retry', { executionId, nodeId });
  }, []);

  const subscribeExecution = useCallback((executionId: string) => {
    const socket = socketRef.current;
    socket.emit('execution:subscribe', executionId);
  }, []);

  return {
    startExecution,
    cancelExecution,
    retryNode,
    subscribeExecution,
  };
}
