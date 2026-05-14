'use client';

import { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { LintIssue, LintReport } from '@llmwiki/shared';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';

const SEVERITY_ICON = {
  error: <AlertCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-yellow-400" />,
  info: <Info className="size-4 text-blue-400" />,
};

const SEVERITY_LABEL = {
  error: '错误',
  warning: '警告',
  info: '提示',
};

const CATEGORY_LABELS: Record<string, string> = {
  'broken-link': '断链',
  'orphan-page': '孤儿页面',
  'missing-frontmatter': '缺少 Frontmatter',
  'duplicate-slug': '重复 Slug',
  'index-mismatch': '索引不匹配',
  'source-missing': '数据源缺失',
  other: '其他',
};

export default function LintPanel() {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<LintReport | null>(null);

  const handleLint = async () => {
    setStatus('running');
    setLogs([]);
    setReport(null);

    try {
      const response = await fetch('/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        setLogs([`HTTP Error: ${response.status} ${response.statusText}`]);
        setStatus('error');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setLogs(['无法读取响应流']);
        setStatus('error');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.pagesScanned !== undefined && data.issues) {
                setReport(data);
              }
              setLogs((prev) => [...prev, typeof data === 'string' ? data : JSON.stringify(data, null, 2)]);
            } catch {
              setLogs((prev) => [...prev, line.slice(6)]);
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (data.pagesScanned !== undefined && data.issues) {
            setReport(data);
          }
          setLogs((prev) => [...prev, typeof data === 'string' ? data : JSON.stringify(data, null, 2)]);
        } catch {
          setLogs((prev) => [...prev, buffer.slice(6)]);
        }
      }

      setStatus('done');
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err instanceof Error ? err.message : '网络错误'}`]);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* 操作按钮 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">Wiki 健康检查</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          扫描 wiki 中的断链、孤儿页面、索引不一致等问题
        </p>
        <button
          onClick={handleLint}
          disabled={status === 'running'}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="size-4" />
          运行检查
        </button>
      </div>

      {/* Lint 报告摘要 */}
      {report && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold">检查报告</h3>
          <div className="mt-2 flex gap-4 text-sm">
            <span>扫描页面: {report.pagesScanned}</span>
            <span className="text-destructive">错误: {report.counts.error}</span>
            <span className="text-yellow-400">警告: {report.counts.warning}</span>
            <span className="text-blue-400">提示: {report.counts.info}</span>
          </div>
        </div>
      )}

      {/* Issue 列表 */}
      {report && report.issues.length > 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold">问题列表 ({report.issues.length})</h3>
          <div className="mt-3 space-y-2">
            {report.issues.map((issue: LintIssue, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-md border bg-background p-3"
              >
                <div className="mt-0.5 shrink-0">
                  {SEVERITY_ICON[issue.severity]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{issue.target}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                      {SEVERITY_LABEL[issue.severity]}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                      {CATEGORY_LABELS[issue.category] || issue.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {issue.message}
                  </p>
                  {issue.suggestion && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      建议: {issue.suggestion}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report && report.issues.length === 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-green-400">未发现任何问题，Wiki 状态良好。</p>
        </div>
      )}

      {/* 执行日志 */}
      <ExecutionLog lines={logs} status={status} />
    </div>
  );
}
