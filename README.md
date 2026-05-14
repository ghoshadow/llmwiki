# LLM Wiki 工具链

基于 **MCP Server + Next.js Web UI + Claude Agent SDK** 的完整 Wiki 知识管理系统。

## 项目结构

```
llmwiki/                # npm workspaces monorepo
├── shared/             # 公共 TypeScript 类型
├── mcp-server/         # MCP + REST API 服务端
├── web-ui/             # Next.js 15 管理后台
├── raw/                # 原始数据源
└── wiki/               # Wiki 页面 (Obsidian 兼容)
    ├── index.md
    └── log.md
```

## 开发

```bash
npm install          # 安装所有工作区依赖
npm run build        # 构建所有工作区
npm run dev          # 启动 MCP Server 开发模式
npm run dev -w web-ui  # 启动 Web UI 开发模式 (端口 3001)
```

MCP Server 默认监听 `http://localhost:3000`，同时提供 MCP stdio 和 REST API 两种协议。

## 当前状态

**LLMWI-13: Claude Agent SDK Integration**

已完成:
- MCP Server: 文件系统层 (`lib/engine.ts`, `lib/markdown.ts`, `lib/backlinks.ts`)，完整 CRUD + 搜索 + Lint + Stats + 索引
- MCP Server: 双协议支持 —— MCP over stdio + REST API over HTTP (Express)
- Web UI: Next.js 15 App Router + Tailwind + 8 个功能页面 (仪表盘/入库/查询/检查/索引/日志/数据源/页面)
- Web UI: SSE 流式 AI 交互 —— 入库、查询、检查均通过 Claude Agent SDK 实现流式响应
- Web UI: 工具调用追踪 —— 实时显示 Claude Agent SDK 调用的 MCP 工具
- Web UI: 状态栏 —— MCP Server 连接状态实时监控
- Claude Agent SDK: 可配置 systemPrompt、maxTurns、permissionMode
- Claude Agent SDK: 会话管理支持 resume 上下文保持
