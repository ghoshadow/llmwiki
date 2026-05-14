import LogPanel from '@/components/log-panel';

export default function LogViewPage() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">日志 (Log)</h2>
      <p className="text-sm text-muted-foreground">
        查看知识库操作日志记录 (log.md)
      </p>
      <LogPanel />
    </div>
  );
}
