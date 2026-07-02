VisAgent/
├── client/                          # React 18 前端
│   └── src/
│       ├── components/
│       │   ├── editor/              # ReactFlow 工作流编辑器 + 5种自定义节点
│       │   ├── layout/              # Header + Sidebar 拖拽面板
│       │   ├── monitor/             # 实时执行监控面板
│       │   └── toolbox/             # Tool 注册管理
│       ├── stores/                  # Zustand 状态 (workflow/execution/tool)
│       ├── hooks/useWebSocket.ts    # Socket.IO 实时通信
│       └── lib/api.ts               # REST API 客户端
├── server/                          # Node.js 后端
│   └── src/
│       ├── engine/executor.ts       # DAG 拓扑执行引擎
│       ├── mcp/server.ts            # MCP 协议工具服务
│       ├── ws/index.ts              # WebSocket 管理器
│       ├── routes/                  # REST API (workflow + tool CRUD)
│       └── db/index.ts              # SQLite 持久化
├── shared/                          # 共享 TypeScript 类型
│   └── src/types/ (workflow, tool, mcp)
├── README.md                        # 完整项目计划 + 路线图
└── .github/copilot-instructions.md  # AI 协作指南