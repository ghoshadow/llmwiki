import fs from "node:fs/promises";
import path from "node:path";
import {
  readPageFile,
  writePageFile,
  deletePageFile,
  extractWikilinks,
  parseMarkdown,
} from "./markdown.js";
import type {
  WikiPage,
  WikiPageSummary,
  WikiIndex,
  IndexCategory,
  IndexEntry,
  WikiStats,
  WikiLog,
  LogEntry,
  LintIssue,
  Backlink,
  SearchResult,
  Source,
  SourceMeta,
} from "@llmwiki/shared";
import MiniSearch from "minisearch";

// ============================================================
// Wiki Engine — core logic for managing a local-first wiki
// ============================================================

export interface EngineOptions {
  wikiDir: string;
  rawDir: string;
  indexPath: string;
  logPath: string;
}

export class WikiEngine {
  wikiDir: string;
  rawDir: string;
  indexPath: string;
  logPath: string;
  searchIndex: MiniSearch;

  constructor(opts: EngineOptions) {
    this.wikiDir = opts.wikiDir;
    this.rawDir = opts.rawDir;
    this.indexPath = opts.indexPath;
    this.logPath = opts.logPath;
    this.searchIndex = new MiniSearch({
      fields: ["title", "content", "tags"],
      storeFields: ["title", "slug", "tags", "status", "updated"],
      searchOptions: { prefix: true, fuzzy: 0.2 },
    });
  }

  // --- Initialization ---

  async init(): Promise<void> {
    await fs.mkdir(this.wikiDir, { recursive: true });
    await fs.mkdir(this.rawDir, { recursive: true });
    await this.rebuildSearchIndex();
  }

  async rebuildSearchIndex(): Promise<void> {
    this.searchIndex.removeAll();
    const slugs = await this.listSlugs();
    for (const slug of slugs) {
      const page = await readPageFile(slug, this.wikiDir);
      if (page) {
        this.searchIndex.add({
          id: slug,
          title: page.meta.title,
          content: page.content,
          tags: page.meta.tags,
          slug,
          status: page.meta.status,
          updated: page.meta.updated,
        });
      }
    }
  }

  // --- Page CRUD ---

  async listSlugs(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.wikiDir);
      return files
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
    } catch {
      return [];
    }
  }

  async listPages(): Promise<WikiPageSummary[]> {
    const slugs = await this.listSlugs();
    const pages: WikiPageSummary[] = [];
    for (const slug of slugs) {
      const page = await readPageFile(slug, this.wikiDir);
      if (page) {
        pages.push({
          slug: page.meta.slug,
          title: page.meta.title,
          status: page.meta.status,
          updated: page.meta.updated,
          tags: page.meta.tags,
        });
      }
    }
    pages.sort(
      (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
    );
    return pages;
  }

  async readPage(slug: string): Promise<WikiPage | null> {
    return readPageFile(slug, this.wikiDir);
  }

  async writePage(page: WikiPage): Promise<void> {
    page.meta.updated = new Date().toISOString();
    if (!page.meta.created) {
      page.meta.created = page.meta.updated;
    }
    await writePageFile(page, this.wikiDir);
    // Update search index
    try {
      this.searchIndex.remove({ id: page.meta.slug });
    } catch {
      // Not in index yet — fine for new pages
    }
    this.searchIndex.add({
      id: page.meta.slug,
      title: page.meta.title,
      content: page.content,
      tags: page.meta.tags,
      slug: page.meta.slug,
      status: page.meta.status,
      updated: page.meta.updated,
    });
    await this.appendLog("info", "write_page", `Page written: ${page.meta.slug}`);
  }

  async deletePage(slug: string): Promise<boolean> {
    const deleted = await deletePageFile(slug, this.wikiDir);
    if (deleted) {
      try {
        this.searchIndex.remove({ id: slug });
      } catch {
        // Not in index — fine
      }
      await this.appendLog("info", "delete_page", `Page deleted: ${slug}`);
    }
    return deleted;
  }

  // --- Search ---

  search(query: string, limit = 20): SearchResult[] {
    if (!query.trim()) return [];
    const results = this.searchIndex.search(query, {});
    return results.slice(0, limit).map((r) => ({
      slug: r.id,
      title: (r as Record<string, unknown>).title as string || r.id,
      snippet: (r.terms || []).join(", "),
      relevance: r.score,
    }));
  }

  // --- Index ---

  async buildIndex(): Promise<WikiIndex> {
    const slugs = await this.listSlugs();
    const categoryMap = new Map<string, IndexEntry[]>();

    for (const slug of slugs) {
      const page = await readPageFile(slug, this.wikiDir);
      if (!page) continue;
      const category = (page.rawFrontmatter.category as string) || "Uncategorized";
      const entry: IndexEntry = {
        title: page.meta.title,
        slug: page.meta.slug,
        category,
        summary: page.content.slice(0, 150).replace(/\n/g, " "),
        tags: page.meta.tags,
        status: page.meta.status,
      };
      const existing = categoryMap.get(category) || [];
      existing.push(entry);
      categoryMap.set(category, existing);
    }

    const categories: IndexCategory[] = [];
    for (const [name, entries] of categoryMap) {
      entries.sort((a, b) => a.title.localeCompare(b.title));
      categories.push({ name, entries });
    }
    categories.sort((a, b) => a.name.localeCompare(b.name));

    return {
      categories,
      lastUpdated: new Date().toISOString(),
    };
  }

  async writeIndex(): Promise<WikiIndex> {
    const index = await this.buildIndex();
    let md = "# LLM Wiki — Knowledge Index\n\n";
    md += `> Last updated: ${index.lastUpdated}\n\n`;
    for (const cat of index.categories) {
      md += `## ${cat.name}\n\n`;
      for (const entry of cat.entries) {
        const status = entry.status === "published" ? "" : ` [${entry.status}]`;
        md += `- **[[${entry.slug}]]** — ${entry.summary}${status}\n`;
      }
      md += "\n";
    }
    await fs.writeFile(this.indexPath, md, "utf-8");
    await this.appendLog("info", "update_index", "Index rebuilt");
    return index;
  }

  // --- Stats ---

  async getStats(): Promise<WikiStats> {
    const slugs = await this.listSlugs();
    let totalWikilinks = 0;
    const allLinks = new Set<string>();
    const allSlugs = new Set(slugs);
    const linkedTo = new Set<string>();
    let publishedPages = 0;
    let draftPages = 0;
    let archivedPages = 0;

    for (const slug of slugs) {
      const page = await readPageFile(slug, this.wikiDir);
      if (!page) continue;
      if (page.meta.status === "published") publishedPages++;
      else if (page.meta.status === "archived") archivedPages++;
      else draftPages++;

      const links = extractWikilinks(page.content);
      totalWikilinks += links.length;
      for (const link of links) {
        allLinks.add(link.target);
        linkedTo.add(link.target);
      }
    }

    const brokenLinks = [...allLinks].filter((l) => !allSlugs.has(l)).length;
    const orphanPages = [...allSlugs].filter((s) => !linkedTo.has(s)).length;

    const sources = await this.listSourceIds();

    return {
      totalPages: slugs.length,
      totalSources: sources.length,
      totalWikilinks,
      brokenLinks,
      orphanPages,
      publishedPages,
      draftPages,
      archivedPages,
      lastUpdated: new Date().toISOString(),
    };
  }

  // --- Lint ---

  async lint(): Promise<LintIssue[]> {
    const issues: LintIssue[] = [];
    const slugs = await this.listSlugs();
    const slugSet = new Set(slugs);
    const linkedTo = new Set<string>();

    for (const slug of slugs) {
      const page = await readPageFile(slug, this.wikiDir);
      if (!page) continue;

      // Check frontmatter
      if (!page.rawFrontmatter.title) {
        issues.push({
          type: "missing-frontmatter",
          slug,
          title: page.meta.title,
          message: `Missing title in frontmatter for "${slug}"`,
          severity: "error",
        });
      }

      // Check tags
      if (page.meta.tags.some((t) => !/^[a-z][\w-]*$/.test(t))) {
        issues.push({
          type: "invalid-tag",
          slug,
          title: page.meta.title,
          message: `Invalid tag format in "${slug}"`,
          detail: { tags: page.meta.tags.filter((t) => !/^[a-z][\w-]*$/.test(t)) },
          severity: "warning",
        });
      }

      // Check wikilinks
      const links = extractWikilinks(page.content);
      for (const link of links) {
        linkedTo.add(link.target);
        if (!slugSet.has(link.target)) {
          issues.push({
            type: "broken-link",
            slug,
            title: page.meta.title,
            message: `Broken link to "${link.target}" from "${slug}"`,
            detail: { target: link.target, line: link.line },
            severity: "error",
          });
        }
      }
    }

    // Check orphans
    for (const slug of slugs) {
      if (!linkedTo.has(slug)) {
        const page = await readPageFile(slug, this.wikiDir);
        issues.push({
          type: "orphan",
          slug,
          title: page?.meta.title || slug,
          message: `Orphan page: "${slug}" has no incoming links`,
          severity: "info",
        });
      }
    }

    return issues;
  }

  // --- Backlinks ---

  async getBacklinks(targetSlug: string): Promise<Backlink[]> {
    const backlinks: Backlink[] = [];
    const slugs = await this.listSlugs();
    for (const slug of slugs) {
      const page = await readPageFile(slug, this.wikiDir);
      if (!page) continue;
      const links = extractWikilinks(page.content);
      for (const link of links) {
        if (link.target === targetSlug) {
          const lines = page.content.split("\n");
          const ctx = lines[link.line - 1]?.trim().slice(0, 120) || "";
          backlinks.push({
            sourceSlug: slug,
            sourceTitle: page.meta.title,
            line: link.line,
            context: ctx,
          });
        }
      }
    }
    return backlinks;
  }

  // --- Sources ---

  async listSourceIds(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.rawDir);
      return files;
    } catch {
      return [];
    }
  }

  async listSources(): Promise<Source[]> {
    const ids = await this.listSourceIds();
    const sources: Source[] = [];
    for (const id of ids) {
      const source = await this.readSourceMeta(id);
      if (source) sources.push(source);
    }
    return sources;
  }

  async readSourceMeta(id: string): Promise<Source | null> {
    const metaPath = path.join(this.rawDir, id, ".meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf-8");
      const meta: SourceMeta = JSON.parse(raw);
      const rawPath = path.join(this.rawDir, id);
      return { meta, rawPath };
    } catch {
      // If no .meta.json, create a basic one
      const rawPath = path.join(this.rawDir, id);
      try {
        const stat = await fs.stat(rawPath);
        if (stat.isFile()) {
          return {
            meta: {
              id,
              filename: id,
              ingestedAt: stat.birthtime.toISOString(),
              status: "pending",
              pageCount: 0,
              hash: "",
            },
            rawPath,
          };
        }
      } catch {
        return null;
      }
      return null;
    }
  }

  async writeSourceMeta(meta: SourceMeta): Promise<void> {
    const dir = path.join(this.rawDir, meta.id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, ".meta.json"),
      JSON.stringify(meta, null, 2),
      "utf-8"
    );
  }

  // --- Log ---

  async getLog(): Promise<WikiLog> {
    try {
      const raw = await fs.readFile(this.logPath, "utf-8");
      const entries: LogEntry[] = [];
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        try {
          const entry = JSON.parse(trimmed);
          if (entry.timestamp && entry.level && entry.action) {
            entries.push(entry);
          }
        } catch {
          // Skip non-JSON lines
        }
      }
      return { entries };
    } catch {
      return { entries: [] };
    }
  }

  async appendLog(
    level: LogEntry["level"],
    action: string,
    message: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      ...(details && { details }),
    };
    try {
      const line = JSON.stringify(entry) + "\n";
      await fs.appendFile(this.logPath, line, "utf-8");
    } catch {
      // Logging failed — should not block operation
    }
  }
}
