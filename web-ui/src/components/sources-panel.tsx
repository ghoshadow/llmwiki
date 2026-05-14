'use client';

import { useEffect, useState, useCallback } from 'react';
import { FolderOpen, FileText, RefreshCw } from 'lucide-react';
import { sourcesApi } from '@/lib/api-client';
import type { Source } from '@llmwiki/shared';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  ingested: 'Ingested',
  error: 'Error',
};

export default function SourcesPanel() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await sourcesApi.list();
    setLoading(false);
    if (result.ok) {
      setSources(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Sources (raw/)</h3>
          <button
            onClick={fetchSources}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            Refresh
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        {loading && <p className="mt-3 text-sm text-muted-foreground">Loading...</p>}
        {!loading && !error && (
          <p className="mt-1 text-sm text-muted-foreground">{sources.length} sources</p>
        )}
      </div>

      {sources.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">ID</th>
                  <th className="px-4 py-2 text-left font-medium">Filename</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Ingested At</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr key={src.meta.id} className="border-b last:border-b-0 hover:bg-accent/50">
                    <td className="px-4 py-2 font-mono text-xs">{src.meta.id}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        {src.meta.filename}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        src.meta.status === 'ingested' ? 'bg-green-100 text-green-700' :
                        src.meta.status === 'error' ? 'bg-red-100 text-red-700' :
                        src.meta.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[src.meta.status] || src.meta.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(src.meta.ingestedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sources.length === 0 && !loading && !error && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">No sources ingested</p>
        </div>
      )}
    </div>
  );
}
