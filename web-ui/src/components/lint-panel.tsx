'use client';

import { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { LintIssue } from '@llmwiki/shared';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  error: <AlertCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-yellow-400" />,
  info: <Info className="size-4 text-blue-400" />,
};

const SEVERITY_LABEL: Record<string, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

const TYPE_LABELS: Record<string, string> = {
  'broken-link': 'Broken Link',
  'orphan': 'Orphan Page',
  'missing-frontmatter': 'Missing Frontmatter',
  'invalid-tag': 'Invalid Tag',
  'contradiction': 'Contradiction',
};

export default function LintPanel() {
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [issues, setIssues] = useState<LintIssue[] | null>(null);

  const handleLint = async () => {
    setStatus('running');
    setLogs([]);
    setIssues(null);

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
        setLogs(['Cannot read response stream']);
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
              if (Array.isArray(data)) {
                setIssues(data);
              }
              setLogs((prev) => [...prev, typeof data === 'string' ? data : JSON.stringify(data, null, 2)]);
            } catch {
              setLogs((prev) => [...prev, line.slice(6)]);
            }
          }
        }
      }

      if (buffer.startsWith('data: ')) {
        try {
          const data = JSON.parse(buffer.slice(6));
          if (Array.isArray(data)) {
            setIssues(data);
          }
          setLogs((prev) => [...prev, typeof data === 'string' ? data : JSON.stringify(data, null, 2)]);
        } catch {
          setLogs((prev) => [...prev, buffer.slice(6)]);
        }
      }

      setStatus('done');
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err instanceof Error ? err.message : 'Network error'}`]);
      setStatus('error');
    }
  };

  const errorCount = issues?.filter((i) => i.severity === 'error').length ?? 0;
  const warnCount = issues?.filter((i) => i.severity === 'warning').length ?? 0;
  const infoCount = issues?.filter((i) => i.severity === 'info').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">Wiki Health Check</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan wiki for broken links, orphan pages, index inconsistencies
        </p>
        <button
          onClick={handleLint}
          disabled={status === 'running'}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShieldCheck className="size-4" />
          Run Check
        </button>
      </div>

      {issues && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold">Check Report</h3>
          <div className="mt-2 flex gap-4 text-sm">
            <span>Pages checked: all</span>
            <span className="text-destructive">Errors: {errorCount}</span>
            <span className="text-yellow-400">Warnings: {warnCount}</span>
            <span className="text-blue-400">Info: {infoCount}</span>
          </div>
        </div>
      )}

      {issues && issues.length > 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold">Issues ({issues.length})</h3>
          <div className="mt-3 space-y-2">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border bg-background p-3">
                <div className="mt-0.5 shrink-0">
                  {SEVERITY_ICON[issue.severity]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{issue.title}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                      {SEVERITY_LABEL[issue.severity]}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                      {TYPE_LABELS[issue.type] || issue.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{issue.message}</p>
                  {issue.detail && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Detail: {JSON.stringify(issue.detail)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {issues && issues.length === 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-green-400">No issues found. Wiki is healthy.</p>
        </div>
      )}

      <ExecutionLog lines={logs} status={status} />
    </div>
  );
}
