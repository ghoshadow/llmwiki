'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { indexApi } from '@/lib/api-client';
import type { WikiIndex } from '@llmwiki/shared';

export default function IndexPanel() {
  const [index, setIndex] = useState<WikiIndex | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await indexApi.get();
    setLoading(false);
    if (result.ok) {
      setIndex(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  const totalEntries = index?.categories.reduce((sum, c) => sum + c.entries.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">知识索引 (index.md)</h3>
          <button
            onClick={fetchIndex}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            刷新
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        {loading && (
          <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
        )}

        {!loading && !error && (
          <p className="mt-1 text-sm text-muted-foreground">
            {index ? `${index.categories.length} categories, ${totalEntries} entries` : ''}
          </p>
        )}
      </div>

      {index && index.categories.length > 0 && (
        <div className="space-y-4">
          {index.categories.map((cat) => (
            <div key={cat.name} className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="border-b bg-muted/50 px-4 py-2">
                <h3 className="font-semibold text-sm">{cat.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-2 text-left font-medium">Title</th>
                      <th className="px-4 py-2 text-left font-medium">Slug</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                      <th className="px-4 py-2 text-left font-medium">Tags</th>
                      <th className="px-4 py-2 text-left font-medium">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.entries.map((entry) => (
                      <tr key={entry.slug} className="border-b last:border-b-0 hover:bg-accent/50">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <FileText className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">{entry.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{entry.slug}</td>
                        <td className="px-4 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${
                            entry.status === 'published' ? 'bg-green-100 text-green-700' :
                            entry.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-xs">{tag}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground max-w-xs truncate">{entry.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {index && index.categories.length === 0 && !loading && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">索引为空</p>
        </div>
      )}
    </div>
  );
}
