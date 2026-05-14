/**
 * Backlink scanner — find all pages that link to a given page
 */

import fs from "node:fs/promises";
import type { Backlink } from "@llmwiki/shared";
import { readPageFile, extractWikilinks } from "./markdown.js";

/** Find all pages linking to a target slug */
export async function getBacklinks(
  target: string,
  wikiDir: string
): Promise<Backlink[]> {
  const backlinks: Backlink[] = [];
  try {
    const entries = await fs.readdir(wikiDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const slug = entry.name.slice(0, -3);
      const page = await readPageFile(slug, wikiDir);
      if (!page) continue;
      const links = extractWikilinks(page.content);
      for (const link of links) {
        if (link.target === target) {
          const lines = page.content.split("\n");
          const contextLine = lines[link.line - 1] || "";
          backlinks.push({
            sourceSlug: slug,
            sourceTitle: page.meta.title,
            line: link.line,
            context: contextLine.trim(),
          });
        }
      }
    }
  } catch {
    // wiki dir may not exist yet
  }
  return backlinks;
}

/** Find orphan pages (pages with no incoming links) */
export async function findOrphans(wikiDir: string): Promise<string[]> {
  const linked = new Set<string>();
  const allSlugs: string[] = [];

  try {
    const entries = await fs.readdir(wikiDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const slug = entry.name.slice(0, -3);
      allSlugs.push(slug);
      const page = await readPageFile(slug, wikiDir);
      if (!page) continue;
      const links = extractWikilinks(page.content);
      for (const link of links) {
        linked.add(link.target);
      }
    }
  } catch {
    return [];
  }

  return allSlugs.filter((s) => !linked.has(s));
}

/** Find broken wikilinks across all pages */
export async function findBrokenLinks(wikiDir: string): Promise<Backlink[]> {
  const broken: Backlink[] = [];
  try {
    const entries = await fs.readdir(wikiDir, { withFileTypes: true });
    const existingSlugs = new Set(
      entries
        .filter((e) => e.isFile() && e.name.endsWith(".md"))
        .map((e) => e.name.slice(0, -3))
    );

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const slug = entry.name.slice(0, -3);
      const page = await readPageFile(slug, wikiDir);
      if (!page) continue;
      const links = extractWikilinks(page.content);
      for (const link of links) {
        if (!existingSlugs.has(link.target)) {
          broken.push({
            sourceSlug: slug,
            sourceTitle: page.meta.title,
            line: link.line,
            context: `Broken link to [[${link.target}]]`,
          });
        }
      }
    }
  } catch {
    // wiki dir may not exist yet
  }
  return broken;
}
