/**
 * Claude Agent SDK Wrapper
 *
 * 封装 Claude Agent SDK 调用逻辑，为 API Routes 提供统一的 AI 操作接口。
 * 使用 @anthropic-ai/claude-agent-sdk 创建 session，通过 MCP 工具执行 wiki 操作。
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKMessage, McpStdioServerConfig, SettingSource } from "@anthropic-ai/claude-agent-sdk";
import type { WikiPageSummary, LintIssue, SearchResult } from "@llmwiki/shared";
import { spawn } from "node:child_process";

// ============================================================
// Types
// ============================================================

export interface ClaudeSessionConfig {
  serverCommand: string;
  serverArgs: string[];
  cwd: string;
  systemPrompt: string;
  maxTurns?: number;
}

export interface IngestRequest {
  sourcePath: string;
  category?: string;
  tags?: string[];
}

export interface IngestResult {
  pages: WikiPageSummary[];
  sourceId: string;
  log: string[];
}

export interface QueryRequest {
  query: string;
  kind?: string;
}

export interface QueryResult {
  answer: string;
  sources: string[];
  relevantPages: SearchResult[];
}

export interface LintRequest {
  filter?: string;
}

export interface LintResult {
  issues: LintIssue[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

export type ProgressCallback = (step: string, message: string) => void;

// ============================================================
// SSE Helper
// ============================================================

export function sendSSE(
  controller: ReadableStreamDefaultController<Uint8Array>,
  event: string,
  data: unknown,
): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(payload));
}

// ============================================================
// Claude Agent SDK Session
// ============================================================

export interface ClaudeSessionOptions {
  maxTurns?: number;
  permissionMode?: "default" | "plan" | "acceptEdits" | "bypassPermissions";
  allowedTools?: string[];
  cwd?: string;
  mcpServers?: Record<string, McpStdioServerConfig>;
  settingSources?: SettingSource[];
  systemPrompt?: string;
}

export interface ClaudeSession {
  sessionId: string | undefined;
  send(prompt: string, options?: ClaudeSessionOptions): AsyncGenerator<SDKMessage>;
}

/**
 * 创建一个可重用的 Claude 会话。
 * 调用 send() 会保留上下文（通过 sessionId resume）。
 */
export function createClaudeSession(
  defaultOptions?: ClaudeSessionOptions
): ClaudeSession {
  let sessionId: string | undefined;

  return {
    get sessionId() {
      return sessionId;
    },

    async *send(prompt: string, options?: ClaudeSessionOptions) {
      const opts = { ...defaultOptions, ...options };

      for await (const msg of query({
        prompt,
        options: {
          maxTurns: opts.maxTurns ?? 10,
          permissionMode: opts.permissionMode ?? "acceptEdits",
          allowedTools: opts.allowedTools,
          mcpServers: opts.mcpServers,
          cwd: opts.cwd,
          settingSources: opts.settingSources,
          systemPrompt: opts.systemPrompt,
          resume: sessionId,
        },
      })) {
        if (msg.type === "system" && msg.subtype === "init") {
          sessionId = msg.session_id;
        }
        yield msg;
      }
    },
  };
}

/** SSE 消息格式 — 用于 API Route 流式传输 */
export interface SSEChunk {
  type: "progress" | "result" | "error" | "done";
  content?: string;
  tool?: string;
  detail?: unknown;
}

/**
 * 将 Claude Agent SDK Message 转换为 SSE chunk
 */
export function messageToSSE(msg: SDKMessage): SSEChunk | null {
  switch (msg.type) {
    case "assistant": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocks = msg.message.content as any[];
      const textBlocks = blocks.filter((block) => block.type === "text");
      const text = textBlocks.map((block) => block.text).join("");
      if (text) return { type: "progress", content: text };
      const toolBlocks = blocks.filter((block) => block.type === "tool_use");
      if (toolBlocks.length > 0) {
        const names = toolBlocks.map((t) => t.name as string);
        return { type: "progress", tool: names[0], content: `调用工具: ${names.join(", ")}` };
      }
      return null;
    }
    case "result":
      return msg.subtype === "success"
        ? { type: "result", content: msg.result }
        : { type: "error", content: msg.errors?.join("; ") ?? "未知错误" };
    default:
      return null;
  }
}

/**
 * 将 SSE chunk 序列化为 SSE 数据行
 */
export function serializeSSE(chunk: SSEChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

// ============================================================
// Claude Session Factory (config-based)
// ============================================================

export function createClaudeSessionConfig(
  task: "ingest" | "query" | "lint",
): ClaudeSessionConfig {
  const baseConfig: Omit<ClaudeSessionConfig, "systemPrompt"> = {
    serverCommand: "node",
    serverArgs: ["mcp-server/dist/index.js"],
    cwd: process.cwd(),
    maxTurns: task === "ingest" ? 30 : 15,
  };

  const prompts: Record<typeof task, string> = {
    ingest: [
      "You are a knowledge ingestion assistant for LLM Wiki.",
      "Your task is to read a source document and create well-structured wiki pages.",
      "Follow these steps:",
      "1. Read the source file to understand its content",
      "2. Break it down into logical topics",
      "3. For each topic, use wiki_write_page to create a wiki page with proper frontmatter",
      "4. Ensure each page has appropriate tags, a clear title, and well-formatted markdown content",
      "5. Link related pages using [[wikilinks]]",
      "6. Use wiki_get_index with rebuild=true to update the index",
      "Report your progress after each page creation.",
    ].join("\n"),

    query: [
      "You are a knowledge query assistant for LLM Wiki.",
      "Your task is to search the wiki knowledge base and answer user questions.",
      "Follow these steps:",
      "1. Use wiki_search to find relevant content",
      "2. Use wiki_read_page to get full details of the most relevant pages",
      "3. If needed, use wiki_get_backlinks to find related pages",
      "4. Synthesize a comprehensive answer from the wiki content",
      "5. Always cite your sources using page slugs",
      "Be thorough but concise in your responses.",
    ].join("\n"),

    lint: [
      "You are a quality assurance assistant for LLM Wiki.",
      "Your task is to check the wiki for issues and inconsistencies.",
      "Follow these steps:",
      "1. Run wiki_lint to get a comprehensive lint report",
      "2. Use wiki_get_index to check that the index matches actual pages",
      "3. Use wiki_list_pages to get all pages",
      "4. Compile a complete report of all findings",
      "Categorize issues by severity and provide actionable recommendations.",
    ].join("\n"),
  };

  return {
    ...baseConfig,
    systemPrompt: prompts[task],
  };
}

// ============================================================
// Tool Definitions
// ============================================================

export function getWikiToolDefinitions() {
  return {
    wiki_read_page: {
      description: "Read a wiki page by its slug. Returns full markdown content and frontmatter.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string", description: "Page slug" } },
        required: ["slug"],
      },
    },
    wiki_write_page: {
      description: "Create or update a wiki page. Provide slug, title, markdown content, and optional tags/status/category.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Page slug" },
          title: { type: "string", description: "Page title" },
          content: { type: "string", description: "Markdown content" },
          tags: { type: "array", items: { type: "string" }, description: "Tags" },
          status: { type: "string", enum: ["draft", "published", "archived"], description: "Page status" },
          category: { type: "string", description: "Index category" },
        },
        required: ["slug", "title", "content"],
      },
    },
    wiki_delete_page: {
      description: "Delete a wiki page by its slug.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string", description: "Page slug" } },
        required: ["slug"],
      },
    },
    wiki_list_pages: {
      description: "List all wiki pages with title, slug, status, tags, and timestamps.",
      parameters: { type: "object", properties: {} },
    },
    wiki_search: {
      description: "Full-text search across all wiki pages with relevance scores.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", description: "Max results (default: 20)" },
        },
        required: ["query"],
      },
    },
    wiki_get_index: {
      description: "Get the categorized wiki index. Use rebuild=true to rebuild from pages.",
      parameters: {
        type: "object",
        properties: {
          rebuild: { type: "boolean", description: "Rebuild index before returning" },
        },
      },
    },
    wiki_get_stats: {
      description: "Get wiki statistics: page counts, links, broken links, orphans.",
      parameters: { type: "object", properties: {} },
    },
    wiki_lint: {
      description: "Analyze wiki for issues: broken wikilinks, orphans, missing frontmatter, invalid tags.",
      parameters: { type: "object", properties: {} },
    },
    wiki_get_backlinks: {
      description: "Get all pages that link to a given page.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string", description: "Target slug" } },
        required: ["slug"],
      },
    },
    wiki_get_log: {
      description: "Retrieve the operation log.",
      parameters: {
        type: "object",
        properties: { limit: { type: "number", description: "Max entries (default: 50)" } },
      },
    },
    source_list: {
      description: "List all ingested raw sources.",
      parameters: { type: "object", properties: {} },
    },
    source_write_meta: {
      description: "Write or update metadata for a raw source.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Source ID" },
          filename: { type: "string", description: "Original filename" },
          status: { type: "string", enum: ["pending", "processing", "ingested", "error"] },
          originalUrl: { type: "string", description: "Original URL" },
          pageCount: { type: "number", description: "Page count" },
          hash: { type: "string", description: "Content hash" },
          errorMessage: { type: "string", description: "Error message if status=error" },
        },
        required: ["id", "filename", "status"],
      },
    },
    wiki_rebuild_search: {
      description: "Rebuild the full-text search index from all page files.",
      parameters: { type: "object", properties: {} },
    },
  };
}

// ============================================================
// MCP Server Process Management
// ============================================================

export function spawnMCPServer(config: ClaudeSessionConfig) {
  return spawn(config.serverCommand, config.serverArgs, {
    cwd: config.cwd,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });
}

// ============================================================
// Ingest Pipeline
// ============================================================

export function buildIngestPrompt(request: IngestRequest): string {
  const lines: string[] = [
    `Ingest the source file at: ${request.sourcePath}`,
  ];
  if (request.category) {
    lines.push(`Assign all created pages to the category: "${request.category}"`);
  }
  if (request.tags && request.tags.length > 0) {
    lines.push(`Add these tags to all created pages: ${request.tags.join(", ")}`);
  }
  lines.push("", "Begin by reading the source file, then create wiki pages for each logical topic.");
  return lines.join("\n");
}

export function buildIngestSystemPrompt(): string {
  return [
    "You are a knowledge ingestion assistant. Your task is to read a source document",
    "and create well-structured wiki pages for each logical topic.",
    "",
    "Workflow:",
    "1. Read the source file content",
    "2. Identify distinct topics and concepts",
    "3. For each topic, use wiki_write_page with:",
    "   - A descriptive slug (lowercase, hyphens for spaces)",
    "   - A clear title",
    "   - Well-structured markdown content with headings, paragraphs, and lists",
    "   - Relevant tags",
    "   - Appropriate status (published for complete, draft for partial)",
    "4. Add [[wikilinks]] between related pages",
    "5. Report what you created at the end",
  ].join("\n");
}

// ============================================================
// Query Pipeline
// ============================================================

export function buildQueryPrompt(request: QueryRequest): string {
  const lines: string[] = [];
  lines.push(`Answer the following question using the wiki knowledge base:`);
  if (request.kind) {
    lines.push(`(Search mode: ${request.kind})`);
  }
  lines.push("", request.query);
  return lines.join("\n");
}

export function buildQuerySystemPrompt(): string {
  return [
    "You are a knowledge query assistant. Answer the user's question by searching",
    "and reading the wiki knowledge base.",
    "",
    "Workflow:",
    "1. Use wiki_search to find relevant pages",
    "2. Use wiki_read_page on the most relevant results to get full content",
    "3. If needed, use wiki_get_backlinks to discover related pages",
    "4. Synthesize a clear, comprehensive answer",
    "5. Always cite the pages you used (by slug/title)",
    "If you cannot find relevant information, say so honestly.",
  ].join("\n");
}

// ============================================================
// Lint Pipeline
// ============================================================

export function buildLintPrompt(_request: LintRequest = {}): string {
  return [
    "Run a comprehensive quality check on the wiki using wiki_lint.",
    "Then check for: broken links, orphan pages, missing frontmatter, invalid tags,",
    "and inconsistencies between the index and actual pages.",
  ].join("\n");
}

export function buildLintSystemPrompt(): string {
  return [
    "You are a wiki quality assurance assistant. Run all available lint checks",
    "and compile a comprehensive report.",
    "",
    "Workflow:",
    "1. Run wiki_lint for a comprehensive check",
    "2. Use wiki_get_index and wiki_list_pages to cross-reference the index with actual pages",
    "3. Compile all findings into a clear report grouped by severity",
    "For each issue, explain what is wrong and suggest how to fix it.",
  ].join("\n");
}
