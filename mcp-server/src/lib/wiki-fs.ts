/**
 * Wiki File System — CRUD operations for wiki pages
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { WikiPageSummary, WikiStats } from "@llmwiki/shared";
import { readPageFile, writePageFile, deletePageFile } from "./markdown.js";

export { readPageFile, writePageFile, deletePageFile };

/** List all wiki page summaries */
export async function listPages(wikiDir: string, filter?: {
  status?: string;
  tag?: string;
}): Promise<WikiPageSummary[]> {
  const summaries: WikiPageSummary[] = [];
  try {
    const entries = await fs.readdir(wikiDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const slug = entry.name.slice(0, -3);
      const page = await readPageFile(slug, wikiDir);
      if (!page) continue;
      if (filter?.status && page.meta.status !== filter.status) continue;
      if (filter?.tag && !page.meta.tags.includes(filter.tag)) continue;
      summaries.push({
        slug: page.meta.slug,
        title: page.meta.title,
        status: page.meta.status,
        updated: page.meta.updated,
        tags: page.meta.tags,
      });
    }
  } catch {
    // Directory may not exist yet
  }
  return summaries;
}

/** Get wiki stats */
export async function getStats(wikiDir: string): Promise<WikiStats> {
  const pages = await listPages(wikiDir);
  const stats: WikiStats = {
    totalPages: pages.length,
    totalSources: 0,
    totalWikilinks: 0,
    brokenLinks: 0,
    orphanPages: 0,
    publishedPages: 0,
    draftPages: 0,
    archivedPages: 0,
    lastUpdated: "",
  };
  for (const p of pages) {
    if (p.status === "published") stats.publishedPages++;
    else if (p.status === "draft") stats.draftPages++;
    else if (p.status === "archived") stats.archivedPages++;
    if (p.updated > stats.lastUpdated) stats.lastUpdated = p.updated;
  }
  return stats;
}

/** Check if a page exists */
export async function pageExists(slug: string, wikiDir: string): Promise<boolean> {
  try {
    await fs.access(path.join(wikiDir, `${slug}.md`));
    return true;
  } catch {
    return false;
  }
}
