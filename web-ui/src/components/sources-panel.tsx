'use client';

import { useEffect, useState, useCallback } from 'react';
import { FolderOpen, FileText, RefreshCw } from 'lucide-react';
import { sourcesApi } from '@/lib/api-client';
import type { SourceFile } from '@llmwiki/shared';

export default function SourcesPanel() {
  const [sources, setSources] = useState<SourceFile[]>([]);
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

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">数据源文件 (raw/)</h3>
          <button
            onClick={fetchSources}
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
            共 {sources.length} 个文件
          </p>
        )}
      </div>

      {/* 文件列表 */}
      {sources.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">文件路径</th>
                  <th className="px-4 py-2 text-left font-medium">大小</th>
                  <th className="px-4 py-2 text-left font-medium">修改时间</th>
                  <th className="px-4 py-2 text-left font-medium">引用页面</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((src) => (
                  <tr
                    key={src.path}
                    className="border-b last:border-b-0 hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-mono text-xs">{src.path}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {(src.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(src.mtime).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2">
                      {src.referencedBy.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {src.referencedBy.map((slug) => (
                            <span
                              key={slug}
                              className="rounded bg-secondary px-1.5 py-0.5 text-xs"
                            >
                              {slug}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          无引用
                        </span>
                      )}
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
          <p className="text-sm text-muted-foreground">raw/ 目录下暂无数据源文件</p>
        </div>
      )}
    </div>
  );
}
