'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Link2, AlertTriangle, BookOpen, Archive, Pencil } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { WikiStats, WikiPageSummary } from '@llmwiki/shared';

export default function DashboardPage() {
  const [stats, setStats] = useState<WikiStats | null>(null);
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [statsRes, pagesRes] = await Promise.all([
      apiClient.getStats(),
      apiClient.listPages(),
    ]);
    setStats(statsRes.ok ? statsRes.data : null);
    setPages(pagesRes.ok ? pagesRes.data : []);
    setError((!statsRes.ok ? statsRes.error : null) ||
             (!pagesRes.ok ? pagesRes.error : null));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button onClick={fetchData} disabled={loading}
          className="text-sm text-muted-foreground hover:text-foreground">
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Pages" value={stats?.totalPages ?? '-'} Icon={FileText} color="blue" />
        <StatCard label="Published" value={stats?.publishedPages ?? '-'} Icon={BookOpen} color="green" />
        <StatCard label="Drafts" value={stats?.draftPages ?? '-'} Icon={Pencil} color="yellow" />
        <StatCard label="Archived" value={stats?.archivedPages ?? '-'} Icon={Archive} color="gray" />
        <StatCard label="Wikilinks" value={stats?.totalWikilinks ?? '-'} Icon={Link2} color="purple" />
        <StatCard label="Broken Links" value={stats?.brokenLinks ?? '-'} Icon={AlertTriangle} color="red" warn={!!stats && stats.brokenLinks > 0} />
        <StatCard label="Orphan Pages" value={stats?.orphanPages ?? '-'} Icon={AlertTriangle} color="orange" warn={!!stats && stats.orphanPages > 0} />
        <StatCard label="Sources" value={stats?.totalSources ?? '-'} Icon={FileText} color="indigo" />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">Recent Pages</h3>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pages yet. Start by ingesting content.</p>
        ) : (
          <div className="space-y-1">
            {pages.slice(0, 10).map((page) => (
              <div key={page.slug} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/50">
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium flex-1">{page.title}</span>
                <span className="text-xs text-muted-foreground">{page.slug}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  page.status === 'published' ? 'bg-green-100 text-green-700' :
                  page.status === 'archived' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{page.status}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(page.updated).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon, color, warn }: {
  label: string; value: number | string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; warn?: boolean;
}) {
  const cm: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${warn ? 'border-red-300 bg-red-50' : cm[color] || 'bg-card'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
