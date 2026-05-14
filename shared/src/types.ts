/**
 * LLM Wiki 共享类型定义
 *
 * 此文件定义了 mcp-server 与 web-ui 之间共享的所有公共类型。
 * 一旦定稿,后续阶段不应修改 (read-only)。
 */

// ============================================================================
// Wiki 页面相关
// ============================================================================

/**
 * Wiki 页面 frontmatter
 */
export interface WikiFrontmatter {
  /** 页面标题 */
  title: string;
  /** 别名 (用于 wikilink 解析) */
  aliases?: string[];
  /** 标签 */
  tags?: string[];
  /** 数据源引用 (raw/ 下的文件路径) */
  sources?: string[];
  /** 创建时间 (ISO 8601) */
  created?: string;
  /** 更新时间 (ISO 8601) */
  updated?: string;
  /** 其他自定义字段 */
  [key: string]: unknown;
}

/**
 * Wiki 页面完整内容
 */
export interface WikiPage {
  /** 页面 slug (无扩展名的文件名,相对 wiki/) */
  slug: string;
  /** 文件绝对路径 */
  path: string;
  /** frontmatter */
  frontmatter: WikiFrontmatter;
  /** 正文 markdown (不含 frontmatter) */
  body: string;
  /** 原始文件内容 */
  raw: string;
}

/**
 * Wiki 页面摘要 (用于列表展示)
 */
export interface WikiPageSummary {
  slug: string;
  title: string;
  tags: string[];
  updated?: string;
}

// ============================================================================
// Wikilink 与反向链接
// ============================================================================

/**
 * Wikilink (即 [[target|alias]])
 */
export interface WikiLink {
  /** 目标 slug 或别名 */
  target: string;
  /** 显示别名 (可选) */
  alias?: string;
  /** 在源文档中的起始位置 */
  start: number;
  /** 在源文档中的结束位置 */
  end: number;
  /** 是否已解析到实际页面 */
  resolved: boolean;
  /** 解析到的 slug (若 resolved=true) */
  resolvedSlug?: string;
}

/**
 * 反向链接条目
 */
export interface Backlink {
  /** 来源页面 slug */
  fromSlug: string;
  /** 来源页面标题 */
  fromTitle: string;
  /** 链接上下文 (周边文本) */
  context: string;
}

// ============================================================================
// 索引 (index.md)
// ============================================================================

/**
 * 索引节点 (递归结构,描述 index.md 的层级)
 */
export interface IndexNode {
  /** 节点标题 */
  title: string;
  /** 关联的 wiki slug (若该节点对应一个页面) */
  slug?: string;
  /** 节点层级 (1-6,对应 Markdown 标题) */
  level: number;
  /** 子节点 */
  children: IndexNode[];
}

/**
 * 索引解析结果
 */
export interface IndexTree {
  /** 根节点列表 */
  roots: IndexNode[];
  /** 索引中引用但 wiki 中不存在的 slug */
  orphanRefs: string[];
  /** wiki 中存在但索引未引用的 slug */
  missingFromIndex: string[];
}

// ============================================================================
// 日志 (log.md)
// ============================================================================

/**
 * 日志条目操作类型
 */
export type LogOperation =
  | 'ingest'
  | 'create'
  | 'update'
  | 'delete'
  | 'rename'
  | 'merge'
  | 'lint'
  | 'reindex';

/**
 * 日志条目
 */
export interface LogEntry {
  /** 时间戳 (ISO 8601) */
  timestamp: string;
  /** 操作类型 */
  operation: LogOperation;
  /** 目标对象 (slug、文件路径或描述) */
  target: string;
  /** 操作摘要 */
  summary: string;
  /** 详细信息 (可选) */
  details?: string;
}

// ============================================================================
// 数据源 (raw/)
// ============================================================================

/**
 * 数据源文件
 */
export interface SourceFile {
  /** 相对 raw/ 的路径 */
  path: string;
  /** 文件大小 (字节) */
  size: number;
  /** 修改时间 */
  mtime: string;
  /** MIME 类型推测 */
  mimeType?: string;
  /** 引用了该数据源的 wiki slug 列表 */
  referencedBy: string[];
}

// ============================================================================
// Lint / 检查
// ============================================================================

/**
 * Lint 问题严重程度
 */
export type LintSeverity = 'error' | 'warning' | 'info';

/**
 * Lint 问题类别
 */
export type LintCategory =
  | 'broken-link'
  | 'orphan-page'
  | 'missing-frontmatter'
  | 'duplicate-slug'
  | 'index-mismatch'
  | 'source-missing'
  | 'other';

/**
 * Lint 问题
 */
export interface LintIssue {
  /** 严重程度 */
  severity: LintSeverity;
  /** 类别 */
  category: LintCategory;
  /** 涉及的 wiki slug 或文件路径 */
  target: string;
  /** 描述 */
  message: string;
  /** 修复建议 (可选) */
  suggestion?: string;
}

/**
 * Lint 报告
 */
export interface LintReport {
  /** 扫描的页面总数 */
  pagesScanned: number;
  /** 问题列表 */
  issues: LintIssue[];
  /** 各严重程度计数 */
  counts: Record<LintSeverity, number>;
  /** 生成时间 */
  generatedAt: string;
}

// ============================================================================
// 搜索
// ============================================================================

/**
 * 搜索类型
 */
export type SearchKind = 'text' | 'tag' | 'slug' | 'frontmatter';

/**
 * 搜索请求
 */
export interface SearchQuery {
  /** 查询字符串 */
  query: string;
  /** 搜索类型 */
  kind?: SearchKind;
  /** 限制返回条数 */
  limit?: number;
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  /** 匹配的页面 slug */
  slug: string;
  /** 页面标题 */
  title: string;
  /** 匹配上下文片段 */
  snippet: string;
  /** 匹配得分 (0-1) */
  score: number;
}

// ============================================================================
// API 通用
// ============================================================================

/**
 * 统一 API 响应包装
 */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; details?: unknown };

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
