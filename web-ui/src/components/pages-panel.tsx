'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, RefreshCw, ChevronRight } from 'lucide-react';
import { pagesApi } from '@/lib/api-client';
import type { WikiPageSummary, WikiPage } from '@llmwiki/shared';

export default function PagesPanel() {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await pagesApi.list();
    setLoading(false);
    if (result.ok) {
      setPages(result.data);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const handleSelectPage = async (slug: string) => {
    setLoadingPage(true);
    const result = await pagesApi.get(slug);
    setLoadingPage(false);
    if (result.ok) {
      setSelectedPage(result.data);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Wiki Pages (wiki/)</h3>
          <button
            onClick={fetchPages}
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
          <p className="mt-1 text-sm text-muted-foreground">{pages.length} pages</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-1">
          <div className="max-h-[600px] overflow-y-auto">
            {pages.length > 0 ? (
              <div className="space-y-0.5 p-2">
                {pages.map((page) => (
                  <button
                    key={page.slug}
                    onClick={() => handleSelectPage(page.slug)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${
                      selectedPage?.meta.slug === page.slug
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-accent-foreground'
                    }`}
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate">{page.title}</span>
                    <ChevronRight className="size-3.5 shrink-0 opacity-50" />
                  </button>
                ))}
              </div>
            ) : !loading && (
              <p className="p-4 text-sm text-muted-foreground">No pages</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm lg:col-span-2">
          {loadingPage ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : selectedPage ? (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{selectedPage.meta.title}</h3>

              <div className="flex flex-wrap gap-2">
                <span className="rounded bg-secondary px-2 py-0.5 text-xs">
                  slug: {selectedPage.meta.slug}
                </span>
                {selectedPage.meta.tags?.map((tag) => (
                  <span key={tag} className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    #{tag}
                  </span>
                ))}
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  Updated: {new Date(selectedPage.meta.updated).toLocaleString()}
                </span>
                <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                  Status: {selectedPage.meta.status}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-medium">Content</h4>
                <pre className="mt-1 max-h-[400px] overflow-y-auto rounded-md border bg-background p-3 text-xs font-mono whitespace-pre-wrap">
                  {selectedPage.content || '(empty)'}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a page from the list to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
