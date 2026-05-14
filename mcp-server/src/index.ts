/**
 * LLM Wiki — MCP Server entry point
 *
 * Dual protocol:
 *  - MCP over stdio (for Claude Code & other MCP clients)
 *  - REST API over HTTP (for the web UI)
 */

import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import { WikiEngine } from "./lib/engine.js";
import { PATHS } from "./types.js";

// ============================================================
// Engine
// ============================================================

const engine = new WikiEngine({
  wikiDir: PATHS.wikiDir,
  rawDir: PATHS.rawDir,
  indexPath: PATHS.indexFile,
  logPath: PATHS.logFile,
});

await engine.init();
console.error(`[llmwiki] Engine initialized (wiki: ${PATHS.wikiDir})`);

// ============================================================
// Tool definitions (shared between MCP and REST)
// ============================================================

const TOOLS = [
  {
    name: "wiki_list_pages",
    description:
      "List all wiki pages with their title, slug, status, tags, and update timestamps.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "wiki_read_page",
    description:
      "Read a wiki page by its slug. Returns full markdown content and frontmatter metadata.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Page slug (filename without .md)" },
      },
      required: ["slug"],
    },
  },
  {
    name: "wiki_write_page",
    description:
      "Create or update a wiki page. Provide slug, title, markdown content, and optional tags/status/category.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Page slug" },
        title: { type: "string", description: "Page title" },
        content: { type: "string", description: "Markdown body" },
        tags: { type: "array", items: { type: "string" }, description: "Tags" },
        status: {
          type: "string",
          enum: ["draft", "published", "archived"],
          description: "Page status (default: draft)",
        },
        category: { type: "string", description: "Category for index grouping" },
      },
      required: ["slug", "title", "content"],
    },
  },
  {
    name: "wiki_delete_page",
    description: "Delete a wiki page by its slug.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Page slug to delete" },
      },
      required: ["slug"],
    },
  },
  {
    name: "wiki_search",
    description:
      "Full-text search across all wiki pages with relevance scores.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default: 20)" },
      },
      required: ["query"],
    },
  },
  {
    name: "wiki_get_index",
    description:
      "Get the categorized wiki index. Set rebuild=true to rebuild from pages first.",
    inputSchema: {
      type: "object" as const,
      properties: {
        rebuild: { type: "boolean", description: "Rebuild index before returning" },
      },
    },
  },
  {
    name: "wiki_get_stats",
    description:
      "Get wiki stats: page counts, links, broken links, orphans, status breakdown.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "wiki_lint",
    description:
      "Analyze wiki for issues: broken wikilinks, orphans, missing frontmatter, invalid tags.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "wiki_get_backlinks",
    description: "Get all pages that link to a given page.",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Target page slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "wiki_get_log",
    description: "Retrieve the operation log.",
    inputSchema: {
      type: "object" as const,
      properties: {
        limit: { type: "number", description: "Max entries (default: 50)" },
      },
    },
  },
  {
    name: "source_list",
    description: "List all ingested raw sources.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "source_write_meta",
    description: "Write or update metadata for a raw source.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "Source ID" },
        filename: { type: "string", description: "Original filename" },
        status: {
          type: "string",
          enum: ["pending", "processing", "ingested", "error"],
          description: "Ingestion status",
        },
        originalUrl: { type: "string", description: "Original URL" },
        pageCount: { type: "number", description: "Page count" },
        hash: { type: "string", description: "Content hash" },
        errorMessage: { type: "string", description: "Error message if status=error" },
      },
      required: ["id", "filename", "status"],
    },
  },
  {
    name: "wiki_rebuild_search",
    description: "Rebuild the full-text search index from all page files.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ============================================================
// Tool executor
// ============================================================

async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  switch (name) {
    case "wiki_list_pages": {
      const pages = await engine.listPages();
      return { success: true, data: pages };
    }
    case "wiki_read_page": {
      const page = await engine.readPage(input.slug as string);
      if (!page) return { success: false, error: `Page not found: ${input.slug}` };
      return { success: true, data: page };
    }
    case "wiki_write_page": {
      const existing = await engine.readPage(input.slug as string);
      const now = new Date().toISOString();
      const pageData = {
        meta: {
          title: input.title as string,
          slug: input.slug as string,
          created: existing?.meta.created || now,
          updated: now,
          tags: (input.tags as string[]) || [],
          status: (input.status as "draft" | "published" | "archived") || "draft",
        },
        content: input.content as string,
        rawFrontmatter: {
          ...(existing?.rawFrontmatter || {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
        },
      } as import("@llmwiki/shared").WikiPage;
      await engine.writePage(pageData);
      return { success: true, data: { slug: input.slug, title: input.title } };
    }
    case "wiki_delete_page": {
      const deleted = await engine.deletePage(input.slug as string);
      if (!deleted) return { success: false, error: `Not found: ${input.slug}` };
      return { success: true, data: { slug: input.slug, deleted: true } };
    }
    case "wiki_search": {
      const results = engine.search(
        input.query as string,
        (input.limit as number) || 20
      );
      return { success: true, data: results };
    }
    case "wiki_get_index": {
      if (input.rebuild) {
        const idx = await engine.writeIndex();
        return { success: true, data: idx };
      }
      const idx = await engine.buildIndex();
      return { success: true, data: idx };
    }
    case "wiki_get_stats": {
      const stats = await engine.getStats();
      return { success: true, data: stats };
    }
    case "wiki_lint": {
      const issues = await engine.lint();
      return { success: true, data: issues };
    }
    case "wiki_get_backlinks": {
      const links = await engine.getBacklinks(input.slug as string);
      return { success: true, data: links };
    }
    case "wiki_get_log": {
      const log = await engine.getLog();
      const limit = (input.limit as number) || 50;
      return { success: true, data: { entries: log.entries.slice(-limit) } };
    }
    case "source_list": {
      const sources = await engine.listSources();
      return { success: true, data: sources };
    }
    case "source_write_meta": {
      const meta: import("@llmwiki/shared").SourceMeta = {
        id: input.id as string,
        filename: input.filename as string,
        originalUrl: input.originalUrl as string | undefined,
        ingestedAt: new Date().toISOString(),
        status: (input.status as "pending" | "processing" | "ingested" | "error") || "pending",
        pageCount: (input.pageCount as number) || 0,
        hash: (input.hash as string) || "",
        errorMessage: input.errorMessage as string | undefined,
      };
      await engine.writeSourceMeta(meta);
      return { success: true, data: meta };
    }
    case "wiki_rebuild_search": {
      await engine.rebuildSearchIndex();
      return { success: true, data: "Search index rebuilt" };
    }
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}

// ============================================================
// MCP Server (stdio transport)
// ============================================================

const mcpServer = new McpServer(
  { name: "llmwiki", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await executeTool(name, (args || {}) as Record<string, unknown>);
  if (result.success) {
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
    isError: true,
  };
});

try {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("[llmwiki] MCP server ready on stdio");
} catch {
  console.error("[llmwiki] MCP stdio not available (running HTTP-only mode)");
}

// ============================================================
// REST API (Express)
// ============================================================

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

// Execute any tool via POST /api/:toolName
app.post("/api/:toolName", async (req, res) => {
  const { toolName } = req.params;
  const result = await executeTool(toolName, req.body || {});
  const status = result.success ? 200 : 400;
  res.status(status).json(result);
});

// GET shortcuts for read-only tools
app.get("/api/pages", async (_req, res) => {
  const r = await executeTool("wiki_list_pages", {});
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/pages/:slug", async (req, res) => {
  const r = await executeTool("wiki_read_page", { slug: req.params.slug });
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/search", async (req, res) => {
  const r = await executeTool("wiki_search", { query: req.query.q, limit: Number(req.query.limit) || 20 });
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/index", async (req, res) => {
  const r = await executeTool("wiki_get_index", { rebuild: req.query.rebuild === "true" });
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/stats", async (_req, res) => {
  const r = await executeTool("wiki_get_stats", {});
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/lint", async (_req, res) => {
  const r = await executeTool("wiki_lint", {});
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/backlinks/:slug", async (req, res) => {
  const r = await executeTool("wiki_get_backlinks", { slug: req.params.slug });
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/log", async (req, res) => {
  const r = await executeTool("wiki_get_log", { limit: Number(req.query.limit) || 50 });
  res.status(r.success ? 200 : 400).json(r);
});

app.get("/api/sources", async (_req, res) => {
  const r = await executeTool("source_list", {});
  res.status(r.success ? 200 : 400).json(r);
});

// ============================================================
// REST API v1 (matches web-ui api-client expectations)
// ============================================================

// POST /api/v1/pages — Create a page
app.post("/api/v1/pages", async (req, res) => {
  const body = req.body || {};
  const r = await executeTool("wiki_write_page", {
    slug: body.slug,
    title: body.title,
    content: body.content,
    tags: body.tags,
    status: body.status,
    category: body.category,
  });
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/pages — List pages (with optional status/tag filter)
app.get("/api/v1/pages", async (req, res) => {
  const pages = await engine.listPages();
  const { status, tag } = req.query;
  let filtered = pages;
  if (status) filtered = filtered.filter((p) => p.status === status);
  if (tag) filtered = filtered.filter((p) => p.tags.includes(tag as string));
  res.json({ success: true, data: filtered });
});

// GET /api/v1/pages/:slug — Read a page
app.get("/api/v1/pages/:slug", async (req, res) => {
  const r = await executeTool("wiki_read_page", { slug: req.params.slug });
  res.status(r.success ? 200 : 400).json(r);
});

// PATCH /api/v1/pages/:slug — Update a page
app.patch("/api/v1/pages/:slug", async (req, res) => {
  const existing = await engine.readPage(req.params.slug);
  if (!existing) {
    res.status(404).json({ success: false, error: `Page not found: ${req.params.slug}` });
    return;
  }
  const body = req.body || {};
  const updated = {
    meta: {
      ...existing.meta,
      title: body.title ?? existing.meta.title,
      tags: body.tags ?? existing.meta.tags,
      status: body.status ?? existing.meta.status,
      updated: new Date().toISOString(),
    },
    content: body.content ?? existing.content,
    rawFrontmatter: existing.rawFrontmatter,
  } as import("@llmwiki/shared").WikiPage;
  await engine.writePage(updated);
  res.json({ success: true, data: updated });
});

// DELETE /api/v1/pages/:slug
app.delete("/api/v1/pages/:slug", async (req, res) => {
  const r = await executeTool("wiki_delete_page", { slug: req.params.slug });
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/search
app.get("/api/v1/search", async (req, res) => {
  const r = await executeTool("wiki_search", { query: req.query.q, limit: Number(req.query.limit) || 20 });
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/index
app.get("/api/v1/index", async (_req, res) => {
  const r = await executeTool("wiki_get_index", {});
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/log
app.get("/api/v1/log", async (req, res) => {
  const r = await executeTool("wiki_get_log", { limit: Number(req.query.limit) || 50 });
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/stats
app.get("/api/v1/stats", async (_req, res) => {
  const r = await executeTool("wiki_get_stats", {});
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/pages/:slug/backlinks
app.get("/api/v1/pages/:slug/backlinks", async (req, res) => {
  const r = await executeTool("wiki_get_backlinks", { slug: req.params.slug });
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/sources
app.get("/api/v1/sources", async (req, res) => {
  const sources = await engine.listSources();
  const { status } = req.query;
  const filtered = status
    ? sources.filter((s) => s.meta.status === status)
    : sources;
  res.json({ success: true, data: filtered });
});

// GET /api/v1/lint
app.get("/api/v1/lint", async (_req, res) => {
  const r = await executeTool("wiki_lint", {});
  res.status(r.success ? 200 : 400).json(r);
});

// GET /api/v1/lint/orphans
app.get("/api/v1/lint/orphans", async (_req, res) => {
  const issues = await engine.lint();
  const orphans = issues
    .filter((i) => i.type === "orphan")
    .map((i) => i.slug);
  res.json({ success: true, data: orphans });
});

// GET /api/v1/lint/broken-links
app.get("/api/v1/lint/broken-links", async (_req, res) => {
  const issues = await engine.lint();
  const brokenBySlug = new Map<string, string[]>();
  for (const issue of issues) {
    if (issue.type === "broken-link" && issue.detail) {
      const slug = issue.slug;
      const existing = brokenBySlug.get(slug) || [];
      existing.push(issue.detail.target as string);
      brokenBySlug.set(slug, existing);
    }
  }
  const result = [...brokenBySlug.entries()].map(([slug, brokenLinks]) => ({
    slug,
    brokenLinks,
  }));
  res.json({ success: true, data: result });
});

app.listen(PORT, () => {
  console.error(`[llmwiki] REST API listening on http://localhost:${PORT}`);
});

export default app;
