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
npm run dev          # 启动开发模式 (各工作区并行)
```

## 当前阶段

**Phase 1 — Monorepo 项目脚手架**

已就绪:
- npm workspaces 根配置
- `shared` 公共类型定义 (`shared/src/types.ts`)
- `mcp-server` TypeScript 包结构
- `web-ui` Next.js 15 + Tailwind + shadcn/ui 项目结构
- `.gitignore` 与 wiki 基础文件 (`index.md`, `log.md`)

下一阶段将填充各模块的具体实现。
