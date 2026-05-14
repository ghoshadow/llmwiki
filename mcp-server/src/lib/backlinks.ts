/**
 * backlinks.ts — 反向链接全局扫描
 *
 * 扫描 wiki/ 下所有 .md 文件，提取其中的 [[wikilink]]，
 * 为每个被引用的目标构建反向链接索引。
 */

import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import { PATHS } from '../types.js';
import { parseWikiLinks } from './markdown.js';
import { parseFrontmatter } from './markdown.js';
import type { Backlink } from '@llmwiki/shared';

// ============================================================================
// 反向链接扫描
// ============================================================================

/**
 * 为指定目标 slug 查找所有反向链接。
 * 返回所有链接到该 slug 的页面列表及其上下文。
 */
export async function scanBacklinks(targetSlug: string): Promise<Backlink[]> {
  const backlinks: Backlink[] = [];
  const pages = await getAllWikiFiles(PATHS.wikiDir);

  for (const file of pages) {
    const raw = await fs.readFile(file, 'utf-8');
    const { frontmatter } = parseFrontmatter(raw);
    const sourceTitle = frontmatter.title || path.basename(file, '.md');
    const links = parseWikiLinks(raw);
    const matchingLinks = links.filter(
      (l) => l.target === targetSlug,
    );

    if (matchingLinks.length > 0) {
      const sourceSlug = path
        .relative(PATHS.wikiDir, file)
        .replace(/\.md$/, '');

      for (const link of matchingLinks) {
        const context = extractContext(raw, link.start, link.end);
        backlinks.push({
          fromSlug: sourceSlug,
          fromTitle: sourceTitle,
          context,
        });
      }
    }
  }

  return backlinks;
}

/**
 * 构建完整的反向链接映射。
 * 返回 Map<targetSlug, Backlink[]>。
 */
export async function getAllBacklinks(): Promise<Map<string, Backlink[]>> {
  const backlinkMap = new Map<string, Backlink[]>();
  const pages = await getAllWikiFiles(PATHS.wikiDir);

  for (const file of pages) {
    const raw = await fs.readFile(file, 'utf-8');
    const { frontmatter } = parseFrontmatter(raw);
    const sourceTitle = frontmatter.title || path.basename(file, '.md');
    const sourceSlug = path
      .relative(PATHS.wikiDir, file)
      .replace(/\.md$/, '');
    const links = parseWikiLinks(raw);
    for (const link of links) {
      const context = extractContext(raw, link.start, link.end);
      const backlink: Backlink = {
        fromSlug: sourceSlug,
        fromTitle: sourceTitle,
        context,
      };

      const existing = backlinkMap.get(link.target);
      if (existing) {
        existing.push(backlink);
      } else {
        backlinkMap.set(link.target, [backlink]);
      }
    }
  }

  return backlinkMap;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 递归获取 wiki/ 下所有 .md 文件的绝对路径。
 */
async function getAllWikiFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(d: string): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(d, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }

  await walk(dir);
  return results;
}

/**
 * 提取 wikilink 周围的上下文文本。
 * 保留链接前后各约 40 个字符作为上下文。
 */
function extractContext(
  raw: string,
  start: number,
  end: number,
): string {
  const contextStart = Math.max(0, start - 40);
  const contextEnd = Math.min(raw.length, end + 40);

  let context = raw.slice(contextStart, contextEnd);

  // 用 ... 标记截断
  if (contextStart > 0) context = '...' + context;
  if (contextEnd < raw.length) context = context + '...';

  // 清理换行，保持单行
  return context.replace(/\n/g, ' ').trim();
}
