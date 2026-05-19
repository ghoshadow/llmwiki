'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Bot, Wrench } from 'lucide-react';
import type { LintIssue } from '@llmwiki/shared';
import { apiClient } from '@/lib/api-client';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';
import { lintStore } from '@/lib/lint-store';

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
  const [status, setStatus] = useState<ExecutionStatus>(lintStore.getState().status);
  const [logs, setLogs] = useState<string[]>(lintStore.getState().logs);
  const [issues, setIssues] = useState<LintIssue[] | null>(lintStore.getState().issues);
  const [aiResponse, setAiResponse] = useState(lintStore.getState().aiResponse);
  const [toolCalls, setToolCalls] = useState<string[]>(lintStore.getState().toolCalls);

  // Subscribe to persistent lint state — keeps running across tab switches
  useEffect(() => {
    const unsub = lintStore.subscribe((s) => {
      setStatus(s.status);
      setLogs(s.logs);
      setIssues(s.issues);
      setAiResponse(s.aiResponse);
      setToolCalls(s.toolCalls);
    });
    return unsub;
  }, []);

  const handleLint = () => {
    lintStore.run(apiClient);
  };

  const handleCancel = () => {
    lintStore.abort();
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
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleLint}
            disabled={status === 'running'}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="size-4" />
            Run Check
          </button>
          {status === 'running' && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {toolCalls.length > 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <Wrench className="size-4 text-muted-foreground" />
            Tool Calls
          </h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {toolCalls.map((tool, i) => (
              <span key={i} className="rounded bg-secondary px-2 py-0.5 text-xs font-mono">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

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
          <p className="text-sm text-green-600 dark:text-green-400">No issues found. Wiki is healthy.</p>
        </div>
      )}

      {aiResponse && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold">
            <Bot className="size-4" />
            AI Analysis
          </h3>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {aiResponse}
          </div>
        </div>
      )}

      <ExecutionLog lines={logs} status={status} />
    </div>
  );
}
