'use client';

import { useState } from 'react';
import { Search, Bot, Wrench } from 'lucide-react';
import type { SearchKind } from '@llmwiki/shared';
import type { SSEChunk } from '@/lib/claude-sdk';
import ExecutionLog from './execution-log';
import type { ExecutionStatus } from './execution-log';

const SEARCH_KINDS: { value: SearchKind; label: string }[] = [
  { value: 'text', label: 'Full Text' },
  { value: 'tag', label: 'Tag' },
  { value: 'slug', label: 'Slug' },
  { value: 'frontmatter', label: 'Frontmatter' },
];

export default function QueryPanel() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind>('text');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [aiResponse, setAiResponse] = useState('');
  const [toolCalls, setToolCalls] = useState<string[]>([]);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setStatus('running');
    setLogs([]);
    setAiResponse('');
    setToolCalls([]);

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
        setLogs(['Cannot read response stream']);
        setStatus('error');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let responseText = '';

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
                  responseText += chunk.content;
                  setAiResponse(responseText);
                }
                setLogs((prev) => [...prev, chunk.content || `Tool: ${chunk.tool}`]);
                break;
              case 'result':
                setAiResponse(chunk.content || '');
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

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const chunk: SSEChunk = JSON.parse(buffer.slice(6));
          if (chunk.type === 'result') setAiResponse(chunk.content || '');
        } catch {
          // ignore malformed final chunk
        }
      }

      setStatus('done');
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err instanceof Error ? err.message : 'Network error'}`]);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold">AI Smart Search</h3>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Enter search keywords..."
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
            Search
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

      {aiResponse && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold">
            <Bot className="size-4" />
            AI Response
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
