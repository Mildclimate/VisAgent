import { createServer } from 'http';
import { createApp } from './app.js';
import { initDatabase } from './db/index.js';
import { wsManager } from './ws/index.js';
import { config } from './config.js';

async function main() {
  // Initialize database
  initDatabase();

  // Create Express app
  const app = createApp();
  const httpServer = createServer(app);

  // Initialize WebSocket
  wsManager.initWebSocket(httpServer);

  // Start server
  httpServer.listen(config.port, config.host, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║           VisAgent Server 🚀                     ║
║  HTTP API:  http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}          ║
║  WebSocket: ws://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}           ║
║  MCP Tools: /api/mcp/tools                       ║
╚══════════════════════════════════════════════════╝
    `);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
