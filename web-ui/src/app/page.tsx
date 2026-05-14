export default function Page() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">仪表盘</h2>
      <p className="text-muted-foreground">
        欢迎使用 LLM Wiki 工具链。此为 Phase 1 脚手架页面,功能将在后续阶段逐步实现。
      </p>
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">当前阶段</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Monorepo 项目脚手架已就绪,包含 <code className="rounded bg-muted px-1">shared</code>、
          <code className="rounded bg-muted px-1">mcp-server</code>、
          <code className="rounded bg-muted px-1">web-ui</code> 三个工作区。
        </p>
      </div>
    </div>
  );
}
