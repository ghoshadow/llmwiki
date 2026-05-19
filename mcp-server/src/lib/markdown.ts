import fs from "node:fs/promises";
import matter from "gray-matter";
import type { WikiPage, Wikilink } from "@llmwiki/shared";

const WIKILINK_RE = /\[\[([^\]|#]+?)(?:[|#]([^\]]+?))?\]\]/g;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

/**
 * Parse a markdown file into a WikiPage (frontmatter + content).
 */
export function parseMarkdown(raw: string, slug: string): WikiPage {
  const { data, content } = matter(raw);
  return {
    meta: {
      title: (data.title as string) || slug,
      slug,
      created: (data.created as string) || new Date().toISOString(),
      updated: (data.updated as string) || new Date().toISOString(),
      tags: normalizeTags(data.tags),
      status: normalizeStatus(data.status),
      sourceUrl: data.sourceUrl as string | undefined,
      sourceHash: data.sourceHash as string | undefined,
    },
    content: content.trim(),
    rawFrontmatter: data,
  };
}

/**
 * Serialize a WikiPage back to markdown with frontmatter.
 */
export function serializeMarkdown(page: WikiPage): string {
  const fm: Record<string, unknown> = {
    title: page.meta.title,
    slug: page.meta.slug,
    created: page.meta.created,
    updated: page.meta.updated,
    tags: page.meta.tags,
    status: page.meta.status,
  };
  if (page.meta.sourceUrl) fm.sourceUrl = page.meta.sourceUrl;
  if (page.meta.sourceHash) fm.sourceHash = page.meta.sourceHash;
  for (const [k, v] of Object.entries(page.rawFrontmatter)) {
    if (!(k in fm)) fm[k] = v;
  }
  return matter.stringify(page.content, fm);
}

/**
 * Extract all [[wikilinks]] from markdown content.
 * HTML comments are stripped before extraction.
 */
export function extractWikilinks(content: string): Wikilink[] {
  const links: Wikilink[] = [];
  const cleaned = content.replace(HTML_COMMENT_RE, "");
  const lines = cleaned.split("\n");
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Toggle code fence state
    if (/^\s*`{3,}/.test(line)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    let match: RegExpExecArray | null;
    const re = new RegExp(WIKILINK_RE.source, "g");
    while ((match = re.exec(line)) !== null) {
      links.push({
        target: match[1].trim(),
        alias: match[2]?.trim(),
        line: i + 1,
        column: match.index + 1,
      });
    }
  }
  return links;
}

/**
 * Read a page from disk by slug.
 */
export async function readPageFile(slug: string, wikiDir: string): Promise<WikiPage | null> {
  const filePath = `${wikiDir}/${slug}.md`;
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return parseMarkdown(raw, slug);
  } catch {
    return null;
  }
}

/**
 * Write a page to disk.
 */
export async function writePageFile(page: WikiPage, wikiDir: string): Promise<void> {
  const md = serializeMarkdown(page);
  await fs.mkdir(wikiDir, { recursive: true });
  await fs.writeFile(`${wikiDir}/${page.meta.slug}.md`, md, "utf-8");
}

/**
 * Delete a page from disk.
 */
export async function deletePageFile(slug: string, wikiDir: string): Promise<boolean> {
  try {
    await fs.unlink(`${wikiDir}/${slug}.md`);
    return true;
  } catch {
    return false;
  }
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function normalizeStatus(status: unknown): "draft" | "published" | "archived" {
  if (status === "published" || status === "archived") return status;
  return "draft";
}
