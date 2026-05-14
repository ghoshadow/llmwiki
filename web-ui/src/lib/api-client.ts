/**
 * API Client - 封装所有对 MCP Server REST API 的调用
 *
 * MCP Server 默认监听 http://localhost:3001
 */

import type {
  ApiResponse,
  WikiPage,
  WikiPageSummary,
  SearchQuery,
  SearchResult,
  IndexTree,
  LogEntry,
  LintReport,
  SourceFile,
  WikiFrontmatter,
} from '@llmwiki/shared';

// ============================================================================
// 配置
// ============================================================================

const DEFAULT_BASE_URL = 'http://localhost:3001';

let baseUrl = DEFAULT_BASE_URL;

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/+$/, '');
}

export function getBaseUrl() {
  return baseUrl;
}

// ============================================================================
// 内部 fetch 封装
// ============================================================================

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  const url = `${baseUrl}/api${path}`;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: json.error ?? `HTTP ${res.status}`,
        details: json.details,
      };
    }

    return { ok: true, data: json as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

function get<T>(path: string) {
  return request<T>('GET', path);
}

function post<T>(path: string, body?: unknown) {
  return request<T>('POST', path, body);
}

function put<T>(path: string, body?: unknown) {
  return request<T>('PUT', path, body);
}

function del<T>(path: string) {
  return request<T>('DELETE', path);
}

// ============================================================================
// Pages API
// ============================================================================

export const pagesApi = {
  /** 列出所有 wiki 页面摘要 */
  list() {
    return get<WikiPageSummary[]>('/pages');
  },

  /** 获取单个页面完整内容 */
  get(slug: string) {
    return get<WikiPage>(`/pages/${encodeURIComponent(slug)}`);
  },

  /** 创建新页面 */
  create(slug: string, frontmatter: WikiFrontmatter, body: string) {
    return post<WikiPage>('/pages', { slug, frontmatter, body });
  },

  /** 更新页面 */
  update(slug: string, frontmatter: WikiFrontmatter, body: string) {
    return put<WikiPage>(`/pages/${encodeURIComponent(slug)}`, {
      frontmatter,
      body,
    });
  },

  /** 删除页面 */
  delete(slug: string) {
    return del<{ deleted: true }>(`/pages/${encodeURIComponent(slug)}`);
  },
};

// ============================================================================
// Search API
// ============================================================================

export const searchApi = {
  /** 搜索 wiki 内容 */
  search(query: SearchQuery) {
    const params = new URLSearchParams({ q: query.query });
    if (query.kind) params.set('kind', query.kind);
    if (query.limit) params.set('limit', String(query.limit));
    return get<SearchResult[]>(`/search?${params.toString()}`);
  },
};

// ============================================================================
// Index API
// ============================================================================

export const indexApi = {
  /** 获取索引树 */
  tree() {
    return get<IndexTree>('/index');
  },
};

// ============================================================================
// Log API
// ============================================================================

export const logApi = {
  /** 列出日志条目 */
  list() {
    return get<LogEntry[]>('/log');
  },

  /** 添加日志条目 */
  add(entry: Omit<LogEntry, 'timestamp'>) {
    return post<LogEntry>('/log', entry);
  },
};

// ============================================================================
// Lint API
// ============================================================================

export const lintApi = {
  /** 运行 lint 检查 */
  check() {
    return get<LintReport>('/lint');
  },
};

// ============================================================================
// Sources API
// ============================================================================

export const sourcesApi = {
  /** 列出 raw/ 下的所有数据源文件 */
  list() {
    return get<SourceFile[]>('/sources');
  },
};

// ============================================================================
// Health / Status
// ============================================================================

export const healthApi = {
  /** 检查 MCP Server 连接状态 */
  async ping(): Promise<{ ok: boolean; latency: number }> {
    const start = performance.now();
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      const latency = Math.round(performance.now() - start);
      return { ok: res.ok, latency };
    } catch {
      return { ok: false, latency: 0 };
    }
  },
};
