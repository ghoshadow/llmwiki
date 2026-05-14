import IngestPanel from '@/components/ingest-panel';

export default function IngestPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">入库 (Ingest)</h2>
      <p className="text-sm text-muted-foreground">
        将 raw/ 下的原始资料解析、转换为 wiki 页面
      </p>
      <IngestPanel />
    </div>
  );
}
