import PagesPanel from '@/components/pages-panel';

export default function PagesViewPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">页面浏览 (Pages)</h2>
      <p className="text-sm text-muted-foreground">
        浏览 wiki/ 目录下的所有知识页面
      </p>
      <PagesPanel />
    </div>
  );
}
