import {
  FileText,
  Download,
  Search,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';

const stats = [
  {
    label: 'Wiki 页面',
    value: '--',
    icon: FileText,
    description: 'wiki/ 目录下的页面总数',
  },
  {
    label: '入库资料',
    value: '--',
    icon: Download,
    description: 'raw/ 目录下的原始资料',
  },
  {
    label: '搜索结果',
    value: '--',
    icon: Search,
    description: '全文搜索可用条目',
  },
  {
    label: 'Lint 问题',
    value: '--',
    icon: ShieldCheck,
    description: '待处理的检查问题',
  },
  {
    label: '数据源文件',
    value: '--',
    icon: FolderOpen,
    description: 'raw/ 目录下的源文件',
  },
];

export default function Page() {
  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">仪表盘</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          欢迎使用 LLM Wiki 工具链。通过左侧导航进入各功能模块，开始管理你的知识库。
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
          >
            <div className="flex items-center gap-2">
              <stat.icon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </h3>
            </div>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* 快速入口 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">快速入口</h3>
        <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">入库 (Ingest)</span>
            {' — '}
            将 raw/ 下的原始文档解析、转换为 wiki 页面。连接 MCP Server 后启用。
          </p>
          <p>
            <span className="font-medium text-foreground">查询 (Query)</span>
            {' — '}
            AI 驱动的智能搜索，支持全文、标签、slug 和 frontmatter 字段检索。
          </p>
          <p>
            <span className="font-medium text-foreground">检查 (Lint)</span>
            {' — '}
            扫描 wiki 中的断链、孤儿页面、索引不一致等问题。
          </p>
        </div>
      </div>

      {/* 系统状态 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">系统状态</h3>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-500" />
            项目脚手架: Monorepo (shared + mcp-server + web-ui)
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-yellow-500" />
            MCP Server: 待启动 (localhost:3001)
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-yellow-500" />
            Web UI: 基础框架 (当前阶段 LLMWI-11)
          </div>
        </div>
      </div>
    </div>
  );
}
