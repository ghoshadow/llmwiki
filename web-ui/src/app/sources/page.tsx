import SourcesPanel from '@/components/sources-panel';

export default function SourcesPage() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">数据源 (Sources)</h2>
      <p className="text-sm text-muted-foreground">
        查看 raw/ 目录下的原始数据源文件及其引用关系
      </p>
      <SourcesPanel />
    </div>
  );
}
