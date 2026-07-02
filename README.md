# VisAgent — 可视化 Agent 工作流编排平台

[![Stack](https://img.shields.io/badge/stack-React%2018%20%7C%20Node.js%20%7C%20TypeScript-blue)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

基于 **MCP (Model Context Protocol)** 的可视化 Agent 工作流编辑器，支持拖拽编排 LLM 调用、工具注册与条件分支，降低 Agent 构建门槛。

---

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🎨 **可视化工作流编辑器** | 基于 ReactFlow 的 DAG 编辑器，拖拽式组合 LLM 调用、工具执行、条件分支、循环、并行等节点 |
| 🔧 **多工具编排引擎** | 支持自定义 Tool 注册，动态参数注入，覆盖信息检索、代码执行、API 调用等场景 |
| 📡 **实时执行监控** | WebSocket 推送 Agent 运行日志与中间状态，节点级状态追踪 |
| 🔄 **断点重试 & 回溯** | 失败节点可单独重试，完整执行历史可回溯 |
| 🤖 **Function Calling 集成** | MCP 协议兼容的 Tool 注册，LLM 可自主选择调用工具 |
| 💾 **工作流持久化** | SQLite 存储工作流定义与执行历史 |

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────┐
│                  Client (React 18)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Workflow │ │ Monitor  │ │  Tool Registry   │ │
│  │ Editor   │ │  Panel   │ │  Manager         │ │
│  │(ReactFlow)│ │          │ │                  │ │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│       │            │               │             │
│       └────────────┼───────────────┘             │
│                    │ Zustand Store                │
│                    │ Socket.IO Client             │
└────────────────────┼─────────────────────────────┘
                     │ HTTP REST + WebSocket
┌────────────────────┼─────────────────────────────┐
│                Server (Node.js)                    │
│  ┌─────────────────┼───────────────────────────┐ │
│  │         API Layer (Express)                  │ │
│  ├──────────┬──────┴──────┬────────────────────┤ │
│  │   MCP    │  Execution  │   Tool Registry    │ │
│  │  Server  │   Engine    │   & Sandbox        │ │
│  ├──────────┴─────────────┴────────────────────┤ │
│  │         WebSocket Manager (Socket.IO)        │ │
│  ├──────────────────────────────────────────────┤ │
│  │         SQLite (better-sqlite3)              │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18, TypeScript, Vite 6, ReactFlow 12, Zustand 5, Tailwind CSS 3, Socket.IO Client |
| **后端** | Node.js, TypeScript, Express 4, Socket.IO 4, better-sqlite3, Zod |
| **协议** | MCP (Model Context Protocol), REST API, WebSocket |
| **工具链** | pnpm 9+ Workspaces (Monorepo) |

---

## 🗺️ 开发路线图

### Phase 1 — 项目骨架 ✅ (已完成)
- [x] Monorepo 结构初始化 (pnpm workspaces)
- [x] 共享类型定义 (`@visagent/shared`)
- [x] 后端 Express + WebSocket 骨架
- [x] 前端 React + ReactFlow 基础布局
- [x] SQLite 数据库表设计

### Phase 2 — 工作流编辑器 ✅ (已完成)
- [x] ReactFlow 完整节点类型（LLM Call, Tool Exec, Condition, Loop, Parallel, Code Exec）
- [x] 节点配置面板（属性编辑）— 每种节点类型都有专用配置面板
- [x] 工作流保存/加载（REST API 联调）— WorkflowList 弹窗管理
- [x] 画布操作增强（撤销/重做 Ctrl+Z / Ctrl+Shift+Z、缩放、小地图）

### Phase 3 — MCP Server + 执行引擎 ✅ (已完成)
- [x] 工作流 DAG 条件感知图遍历执行（BFS，支持条件分支路由 + 跳过未走分支）
- [x] LLM 调用节点（OpenAI 兼容 API，支持 DeepSeek/通义千问/Ollama）
- [x] Tool 执行节点（从 Tool Registry DB 查找并执行，支持自定义 JS Handler）
- [x] Condition 条件分支路由（表达式求值 + trueBranch/falseBranch 跳转）
- [x] 节点间上下文传递与模板插值（`$ref.nodeId.field` 引用 + `{{nested.path}}` 模板）
- [x] REST API 运行端点（`POST /api/workflows/:id/run` + 执行状态查询 + 取消）

### Phase 4 — 实时监控
- [ ] WebSocket 执行事件推送（node:started/completed/error）
- [ ] Monitor Panel 实时日志展示
- [ ] 节点执行状态可视化（颜色变化、动画）
- [ ] 断点重试机制

### Phase 5 — Function Calling 集成
- [ ] MCP 协议 Tool 注册与发现
- [ ] LLM Function Calling 循环（tool_calls → 执行 → 返回结果）
- [ ] 动态参数注入（上下文引用、表达式求值）
- [ ] 沙箱代码执行（JS 安全沙箱）

### Phase 6 — 持久化 & 打磨
- [ ] 执行历史查询与回溯
- [ ] 工作流版本管理
- [ ] 错误处理与重试策略
- [ ] UI/UX 打磨

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

### 安装与运行

```bash
# 克隆仓库
git clone <repo-url>
cd VisAgent

# 安装依赖
pnpm install

# 配置 LLM API Key
cp server/.env.example server/.env
# 编辑 server/.env，填入你的 OPENAI_API_KEY

# 启动开发模式（前端 + 后端同时启动）
pnpm dev
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- WebSocket：ws://localhost:3001

### 单独启动

```bash
# 只启动前端
pnpm dev:client

# 只启动后端
pnpm dev:server
```

---

## 📁 项目结构

```
VisAgent/
├── .github/
│   └── copilot-instructions.md  # AI 协作指南
├── client/                      # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── editor/          # 工作流编辑器
│   │   │   │   ├── WorkflowEditor.tsx
│   │   │   │   ├── NodeConfigPanel.tsx
│   │   │   │   └── nodes/       # 自定义节点
│   │   │   ├── layout/          # Header, Sidebar
│   │   │   ├── monitor/         # 执行监控面板
│   │   │   └── toolbox/         # 工具管理
│   │   ├── stores/              # Zustand 状态管理
│   │   ├── hooks/               # useWebSocket, useApi
│   │   ├── lib/                 # API 客户端
│   │   └── App.tsx
│   └── index.html
├── server/                      # Node.js 后端
│   ├── src/
│   │   ├── engine/executor.ts   # 工作流执行引擎
│   │   ├── mcp/server.ts        # MCP 服务器
│   │   ├── ws/index.ts          # WebSocket 管理
│   │   ├── routes/              # REST API 路由
│   │   ├── db/index.ts          # SQLite 数据库
│   │   └── config.ts            # 配置
│   └── .env.example
├── shared/                      # 共享类型
│   └── src/types/
│       ├── workflow.ts
│       ├── tool.ts
│       └── mcp.ts
├── package.json                 # Monorepo 根配置
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## 📄 License

MIT
