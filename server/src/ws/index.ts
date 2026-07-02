import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { WsServerEvent } from '@visagent/shared';
import { startExecution, cancelExecution, retryNode } from '../engine/executor.js';
import { config } from '../config.js';

let io: Server;

/** Maps executionId -> Set<socketId> for scoped event broadcasting */
const executionRooms = new Map<string, Set<string>>();

export function initWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);
      // Remove socket from all rooms
      for (const [, sockets] of executionRooms) {
        sockets.delete(socket.id);
      }
    });

    // Client requests to join an execution room to receive live updates
    socket.on('execution:subscribe', (executionId: string) => {
      socket.join(`execution:${executionId}`);
      if (!executionRooms.has(executionId)) {
        executionRooms.set(executionId, new Set());
      }
      executionRooms.get(executionId)!.add(socket.id);
      console.log(`[WS] ${socket.id} subscribed to execution:${executionId}`);
    });

    socket.on('execution:unsubscribe', (executionId: string) => {
      socket.leave(`execution:${executionId}`);
      executionRooms.get(executionId)?.delete(socket.id);
    });

    // Start a new workflow execution
    socket.on('execution:start', async (data: { workflowId: string; inputs: Record<string, unknown> }) => {
      try {
        const execution = await startExecution(data.workflowId, data.inputs);
        socket.emit('execution:started', { execution });
        // Auto-subscribe sender to execution room
        socket.join(`execution:${execution.executionId}`);
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });

    // Cancel a running execution
    socket.on('execution:cancel', (data: { executionId: string }) => {
      const ok = cancelExecution(data.executionId);
      socket.emit('execution:cancelled', { executionId: data.executionId, success: ok });
    });

    // Retry a failed node
    socket.on('execution:retry', async (data: { executionId: string; nodeId: string }) => {
      try {
        const ok = await retryNode(data.executionId, data.nodeId);
        socket.emit('execution:retryResult', { executionId: data.executionId, nodeId: data.nodeId, success: ok });
      } catch (err: any) {
        socket.emit('error', { message: err.message });
      }
    });
  });

  console.log('[WS] WebSocket server initialized');
  return io;
}

/** Send an event to all clients subscribed to a specific execution */
export function sendToExecution(executionId: string, event: WsServerEvent): void {
  if (!io) return;
  io.to(`execution:${executionId}`).emit(event.type, event);
}

/** Broadcast to all connected clients */
export function broadcast(event: WsServerEvent): void {
  if (!io) return;
  io.emit(event.type, event);
}

export const wsManager = {
  initWebSocket,
  sendToExecution,
  broadcast,
  get io() { return io; },
};
