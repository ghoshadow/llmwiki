'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, Wrench, FileText } from 'lucide-react';
import { sourcesApi } from '@/lib/api-client';
import type { Source } from '@llmwiki/shared';
import type { SSEChunk } from '@/lib/claude-sdk';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';

export default function IngestPanel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [progress, setProgress] = useState('');

  const fetchSources = useCallback(async () => {
    setLoadingSources(true);
    const result = await sourcesApi.list();
    setLoadingSources(false);
    if (result.ok) {
      setSources(result.data);
    }
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const handleIngest = async () => {
    if (!selected) return;
    setStatus('running');
    setLogs([]);
    setToolCalls([]);
    setProgress('');

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourcePath: selected }),
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
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk: SSEChunk = JSON.parse(line.slice(6));
            switch (chunk.type) {
              case 'progress':
                if (chunk.tool) {
                  setToolCalls((prev) => [...prev, chunk.tool!]);
                }
                if (chunk.content) {
                  setProgress((prev) => prev + chunk.content!);
                }
                setLogs((prev) => [...prev, chunk.content || `Tool: ${chunk.tool}`]);
                break;
              case 'result':
                setLogs((prev) => [...prev, chunk.content || '']);
                break;
              case 'error':
                setLogs((prev) => [...prev, `Error: ${chunk.content}`]);
                setStatus('error');
                return;
              case 'done':
                break;
            }
          } catch {
            setLogs((prev) => [...prev, line.slice(6)]);
          }
        }
      }

      setStatus('done');
      fetchSources();
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err instanceof Error ? err.message : 'Network error'}`]);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">Document Ingestion</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a source file and let AI create wiki pages from it
        </p>

        <div className="mt-4 flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a source file...</option>
            {sources.map((s) => (
              <option key={s.meta.id} value={s.rawPath}>
                {s.meta.filename} ({s.meta.status})
              </option>
            ))}
          </select>
          <button
            onClick={fetchSources}
            disabled={loadingSources}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            <RefreshCw className={loadingSources ? 'animate-spin' : ''} size={14} />
          </button>
          <button
            onClick={handleIngest}
            disabled={!selected || status === 'running'}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="size-4" />
            Ingest
          </button>
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

      {progress && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold">
            <FileText className="size-4" />
            AI Progress
          </h3>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
            {progress}
          </div>
        </div>
      )}

      <ExecutionLog lines={logs} status={status} />
    </div>
  );
}
