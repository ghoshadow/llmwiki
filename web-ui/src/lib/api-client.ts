/**
 * REST API Client — LLM Wiki
 *
 * 封装对 MCP Server REST API 的 HTTP 调用。
 * LLMWI-11: 已创建完整 API 客户端。
 */

import type {
  WikiPage,
  WikiPageSummary,
  WikiIndex,
  WikiLog,
  WikiStats,
  SearchResult,
  Source,
  LintIssue,
  Backlink,
  ApiResponse,
  PaginatedResponse,
} from "@llmwiki/shared";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

export const apiClient = {
  // Pages
  listPages: (params?: {
    status?: string;
    tag?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.tag) qs.set("tag", params.tag);
    return request<WikiPageSummary[]>(`/api/v1/pages?${qs}`);
  },

  getPage: (slug: string) =>
    request<WikiPage>(`/api/v1/pages/${encodeURIComponent(slug)}`),

  createPage: (page: {
    slug: string;
    title: string;
    content: string;
    tags?: string[];
    status?: string;
    category?: string;
    summary?: string;
    sourceUrl?: string;
  }) =>
    request<WikiPage>("/api/v1/pages", {
      method: "POST",
      body: JSON.stringify(page),
    }),

  updatePage: (
    slug: string,
    updates: Partial<{
      title: string;
      content: string;
      tags: string[];
      status: string;
    }>
  ) =>
    request<WikiPage>(`/api/v1/pages/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  deletePage: (slug: string) =>
    request<null>(`/api/v1/pages/${encodeURIComponent(slug)}`, {
      method: "DELETE",
    }),

  // Search
  search: (query: string, limit?: number) => {
    const qs = new URLSearchParams({ q: query });
    if (limit) qs.set("limit", String(limit));
    return request<SearchResult[]>(`/api/v1/search?${qs}`);
  },

  // Index
  getIndex: () => request<WikiIndex>("/api/v1/index"),

  // Log
  getLog: (limit?: number) => {
    const qs = limit ? `?limit=${limit}` : "";
    return request<WikiLog>(`/api/v1/log${qs}`);
  },

  // Stats
  getStats: () => request<WikiStats>("/api/v1/stats"),

  // Backlinks
  getBacklinks: (slug: string) =>
    request<Backlink[]>(`/api/v1/pages/${encodeURIComponent(slug)}/backlinks`),

  // Sources
  listSources: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<Source[]>(`/api/v1/sources${qs}`);
  },

  // Lint
  lint: () => request<LintIssue[]>("/api/v1/lint"),

  findOrphans: () => request<string[]>("/api/v1/lint/orphans"),

  findBrokenLinks: () => request<{ slug: string; brokenLinks: string[] }[]>(
    "/api/v1/lint/broken-links"
  ),
};
