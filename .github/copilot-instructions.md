# Copilot instructions for this repository

## Build, test, and lint commands

```bash
pnpm install                   # Install all dependencies
pnpm dev                       # Start both client & server in dev mode
pnpm dev:client                # Vite dev server (port 5173)
pnpm dev:server                # Express + WebSocket server (port 3001)
pnpm build                     # Build all packages
pnpm typecheck                 # Type-check all packages
```

## High-level architecture

VisAgent is a **pnpm monorepo** with three packages:

```
visagent/
├── client/          # React 18 + Vite + TailwindCSS frontend
│   └── src/
│       ├── components/editor/    # ReactFlow-based DAG workflow editor
│       ├── components/monitor/   # Real-time execution monitoring panel
│       ├── components/toolbox/   # Tool registry UI
│       ├── components/layout/    # App shell (Header, Sidebar)
│       ├── stores/               # Zustand stores (workflow, execution, tool)
│       ├── hooks/                # useWebSocket, custom hooks
│       └── lib/                  # API client
├── server/          # Node.js + Express + Socket.IO backend
│   └── src/
│       ├── engine/executor.ts    # Workflow DAG execution engine
│       ├── mcp/server.ts         # MCP-compliant tool server
│       ├── ws/index.ts           # WebSocket manager (Socket.IO)
│       ├── routes/               # REST API routes
│       └── db/index.ts           # SQLite persistence layer
└── shared/          # Shared TypeScript types
    └── src/types/
        ├── workflow.ts           # Workflow DAG, node, edge types
        ├── tool.ts               # Tool definition & execution types
        └── mcp.ts                # MCP protocol types
```

**Data flow:**
- User drags nodes in ReactFlow → Zustand store → Save to SQLite via REST API
- Run workflow → WebSocket `execution:start` → Server engine topologically executes nodes → WebSocket push events back → Client updates node status in real-time
- Tool execution → MCP server lists registered tools → LLM calls with function calling → Tool execution result back to workflow

## Key conventions

- **Package manager**: pnpm 9+ with workspaces
- **Language**: TypeScript 5.7+ with strict mode
- **Frontend**: React 18, Vite 6, Tailwind CSS 3, ReactFlow 12, Zustand 5
- **Backend**: Express 4, Socket.IO 4, better-sqlite3, Zod for validation
- **Shared types**: `@visagent/shared` workspace package, re-exported from `shared/src/index.ts`
- **Styling**: Tailwind utility classes, dark theme by default (`bg-surface-*` palette)
- **Naming**: PascalCase components, camelCase functions, kebab-case for node types (`llm-call`, `tool-exec`)
- **File organization**: One component per file, co-locate node types in `nodes/` subdirectory
- **State**: Zustand for global state, ReactFlow's internal state for node/edge positions
