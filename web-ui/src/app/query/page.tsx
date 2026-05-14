import QueryPanel from '@/components/query-panel';

export default function QueryPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">查询 (Query)</h2>
      <p className="text-sm text-muted-foreground">
        AI 驱动的智能搜索，支持全文、标签、slug 和 frontmatter 字段检索
      </p>
      <QueryPanel />
    </div>
  );
}
