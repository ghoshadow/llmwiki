'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { SearchKind, SearchResult } from '@llmwiki/shared';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';

const SEARCH_KINDS: { value: SearchKind; label: string }[] = [
  { value: 'text', label: '全文搜索' },
  { value: 'tag', label: '标签搜索' },
  { value: 'slug', label: 'Slug 搜索' },
  { value: 'frontmatter', label: 'Frontmatter 搜索' },
];

export default function QueryPanel() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind>('text');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleQuery = async () => {
    if (!query.trim()) return;

    setStatus('running');
    setLogs([]);
    setResults([]);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), kind }),
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
              if (data.slug && data.title) {
                setResults((prev) => [...prev, data]);
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
          if (data.slug && data.title) {
            setResults((prev) => [...prev, data]);
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
      {/* 搜索表单 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">AI 智能搜索</h3>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="输入搜索关键词..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SearchKind)}
            className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SEARCH_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleQuery}
            disabled={!query.trim() || status === 'running'}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="size-4" />
            搜索
          </button>
        </div>
      </div>

      {/* 搜索结果 */}
      {results.length > 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold">搜索结果 ({results.length})</h3>
          <div className="mt-3 space-y-2">
            {results.map((result, i) => (
              <div
                key={`${result.slug}-${i}`}
                className="rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{result.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {result.slug}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    得分: {result.score.toFixed(2)}
                  </span>
                </div>
                {result.snippet && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {result.snippet}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 执行日志 */}
      <ExecutionLog lines={logs} status={status} />
    </div>
  );
}
