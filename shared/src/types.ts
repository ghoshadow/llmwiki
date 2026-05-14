// ============================================================
// LLM Wiki — Shared Types
// ============================================================

// --- Wiki Page ---

export interface WikiPageMeta {
  title: string;
  slug: string;
  created: string;   // ISO 8601
  updated: string;   // ISO 8601
  tags: string[];
  status: "draft" | "published" | "archived";
  sourceUrl?: string;
  sourceHash?: string;
}

export interface WikiPage {
  meta: WikiPageMeta;
  content: string;           // markdown body (without frontmatter)
  rawFrontmatter: Record<string, unknown>;
}

export interface WikiPageSummary {
  slug: string;
  title: string;
  status: string;
  updated: string;
  tags: string[];
}

// --- Wikilink ---

export interface Wikilink {
  target: string;            // [[target]] or [[target|alias]]
  alias?: string;
  line: number;
  column: number;
}

// --- Index ---

export interface IndexEntry {
  title: string;
  slug: string;
  category: string;
  summary: string;
  tags: string[];
  status: "draft" | "published" | "archived";
}

export interface IndexCategory {
  name: string;
  entries: IndexEntry[];
}

export interface WikiIndex {
  categories: IndexCategory[];
  lastUpdated: string;
}

// --- Log ---

export interface LogEntry {
  timestamp: string;         // ISO 8601
  level: "info" | "warn" | "error";
  action: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface WikiLog {
  entries: LogEntry[];
}

// --- Stats ---

export interface WikiStats {
  totalPages: number;
  totalSources: number;
  totalWikilinks: number;
  brokenLinks: number;
  orphanPages: number;
  publishedPages: number;
  draftPages: number;
  archivedPages: number;
  lastUpdated: string;
}

// --- Backlinks ---

export interface Backlink {
  sourceSlug: string;
  sourceTitle: string;
  line: number;
  context: string;           // surrounding text
}

// --- Search ---

export interface SearchResult {
  slug: string;
  title: string;
  snippet: string;
  relevance: number;         // 0-1
}

// --- Source ---

export interface SourceMeta {
  id: string;
  filename: string;
  originalUrl?: string;
  ingestedAt: string;
  status: "pending" | "processing" | "ingested" | "error";
  pageCount: number;
  hash: string;
  errorMessage?: string;
}

export interface Source {
  meta: SourceMeta;
  rawPath: string;           // path to raw file in /raw/
}

// --- Lint ---

export interface LintIssue {
  type: "broken-link" | "orphan" | "contradiction" | "missing-frontmatter" | "invalid-tag";
  slug: string;
  title: string;
  message: string;
  detail?: Record<string, unknown>;
  severity: "error" | "warning" | "info";
}

// --- API ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  offset: number;
  limit: number;
}
