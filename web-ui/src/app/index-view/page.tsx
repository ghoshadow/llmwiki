import IndexPanel from '@/components/index-panel';

export default function IndexViewPage() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">索引 (Index)</h2>
      <p className="text-sm text-muted-foreground">
        查看知识索引导航结构 (index.md)
      </p>
      <IndexPanel />
    </div>
  );
}
