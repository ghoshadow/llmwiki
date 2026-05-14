/**
 * REST API Client — LLM Wiki
 *
 * Encapsulates HTTP calls to the MCP Server REST API.
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
} from "@llmwiki/shared";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/** Server API response shape: { success, data?, error? } */
interface ServerResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Panel-compatible response format used by UI components */
interface PanelResponse<T> {
  ok: boolean;
  data: T;
  latency: number | null;
  error: string | null;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<PanelResponse<T>> {
  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json() as ServerResponse<T>;
    return {
      ok: json.success === true,
      data: json.data as T,
      latency: Math.round(performance.now() - start),
      error: json.error || null,
    };
  } catch {
    return {
      ok: false,
      data: [] as unknown as T,
      latency: Math.round(performance.now() - start),
      error: "Network error",
    };
  }
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

// Named exports for panel components
export const pagesApi = {
  list: apiClient.listPages,
  get: apiClient.getPage,
  create: apiClient.createPage,
  update: apiClient.updatePage,
  delete: apiClient.deletePage,
};

export const indexApi = {
  get: () => apiClient.getIndex(),
};

export const logApi = {
  list: (limit?: number) => apiClient.getLog(limit),
};

export const sourcesApi = {
  list: apiClient.listSources,
};

export const healthApi = {
  ping: () => request<{ status: string; version: string }>("/health"),
};
