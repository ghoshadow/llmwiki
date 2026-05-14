'use client';

import { useEffect, useState, useCallback } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { logApi } from '@/lib/api-client';
import type { LogEntry } from '@llmwiki/shared';

const OPERATION_LABELS: Record<string, string> = {
  ingest: '入库',
  create: '创建',
  update: '更新',
  delete: '删除',
  rename: '重命名',
  merge: '合并',
  lint: '检查',
  reindex: '重索引',
};

export default function LogPanel() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await logApi.list();
    setLoading(false);
    if (result.ok) {
      setEntries(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">操作日志 (log.md)</h3>
          <button
            onClick={fetchLog}
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
            共 {entries.length} 条记录
          </p>
        )}
      </div>

      {/* 日志列表 */}
      {entries.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">时间</th>
                  <th className="px-4 py-2 text-left font-medium">操作</th>
                  <th className="px-4 py-2 text-left font-medium">目标</th>
                  <th className="px-4 py-2 text-left font-medium">摘要</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0 hover:bg-accent/50 transition-colors"
                  >
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                        {OPERATION_LABELS[entry.operation] || entry.operation}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {entry.target}
                    </td>
                    <td className="px-4 py-2">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {entries.length === 0 && !loading && !error && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">暂无日志记录</p>
        </div>
      )}
    </div>
  );
}
