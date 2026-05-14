'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { sourcesApi } from '@/lib/api-client';
import type { SourceFile } from '@llmwiki/shared';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';

export default function IngestPanel() {
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const fetchSources = useCallback(async () => {
    setLoadingSources(true);
    const result = await sourcesApi.list();
    setLoadingSources(false);
    if (result.ok) {
      setSources(result.data);
      if (!selected && result.data.length > 0) {
        setSelected(result.data[0].path);
      }
    }
  }, [selected]);

  useEffect(() => {
    fetchSources();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIngest = async () => {
    if (!selected) return;

    setStatus('running');
    setLogs([]);

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
      {/* 选择数据源 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">选择数据源</h3>
          <button
            onClick={fetchSources}
            disabled={loadingSources}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <RefreshCw className={loadingSources ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>

        {sources.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {loadingSources ? '加载中...' : 'raw/ 目录下暂无数据源文件'}
          </p>
        ) : (
          <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {sources.map((src) => (
              <label
                key={src.path}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                  selected === src.path
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="source"
                  value={src.path}
                  checked={selected === src.path}
                  onChange={(e) => setSelected(e.target.value)}
                  className="sr-only"
                />
                <FileText className="size-4 shrink-0" />
                <span className="flex-1 truncate">{src.path}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(src.size / 1024).toFixed(1)} KB
                </span>
              </label>
            ))}
          </div>
        )}

        <button
          onClick={handleIngest}
          disabled={!selected || status === 'running'}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="size-4" />
          开始入库
        </button>
      </div>

      {/* 执行日志 */}
      <ExecutionLog lines={logs} status={status} />
    </div>
  );
}
