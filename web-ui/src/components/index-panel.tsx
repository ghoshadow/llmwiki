'use client';

import { useEffect, useState, useCallback } from 'react';
import { ListTree, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { indexApi } from '@/lib/api-client';
import type { IndexTree, IndexNode } from '@llmwiki/shared';

function TreeNode({ node, depth = 0 }: { node: IndexNode; depth?: number }) {
  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent/50"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="font-medium">{node.title}</span>
        {node.slug && (
          <span className="text-xs text-muted-foreground truncate">
            ({node.slug})
          </span>
        )}
      </div>
      {node.children.map((child, i) => (
        <TreeNode key={`${child.title}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function IndexPanel() {
  const [tree, setTree] = useState<IndexTree | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await indexApi.tree();
    setLoading(false);
    if (result.ok) {
      setTree(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  return (
    <div className="space-y-4">
      {/* 标题 */}
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
      </div>

      {/* 索引树 */}
      {tree && tree.roots.length > 0 && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <h3 className="font-semibold mb-3">索引结构</h3>
          <div className="space-y-0.5">
            {tree.roots.map((node, i) => (
              <TreeNode key={`${node.title}-${i}`} node={node} />
            ))}
          </div>
        </div>
      )}

      {/* 警告 */}
      {tree && (
        <div className="space-y-2">
          {tree.orphanRefs.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-yellow-400" />
                <h3 className="font-semibold">
                  索引引用但页面不存在 ({tree.orphanRefs.length})
                </h3>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {tree.orphanRefs.map((slug) => (
                  <span
                    key={slug}
                    className="rounded bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-400"
                  >
                    {slug}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tree.missingFromIndex.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-card p-4 text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-blue-400" />
                <h3 className="font-semibold">
                  页面存在但索引未收录 ({tree.missingFromIndex.length})
                </h3>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {tree.missingFromIndex.map((slug) => (
                  <span
                    key={slug}
                    className="rounded bg-blue-400/10 px-2 py-0.5 text-xs text-blue-400"
                  >
                    {slug}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tree && tree.roots.length === 0 && !loading && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">索引为空</p>
        </div>
      )}
    </div>
  );
}
