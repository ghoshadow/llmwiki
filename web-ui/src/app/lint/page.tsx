import LintPanel from '@/components/lint-panel';

export default function LintPage() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">检查 (Lint)</h2>
      <p className="text-sm text-muted-foreground">
        扫描 wiki 中的断链、孤儿页面、索引不一致等问题
      </p>
      <LintPanel />
    </div>
  );
}
