/**
 * wiki-fs.ts - wiki/ 文件系统 CRUD
 *
 * 提供对 wiki 目录下 markdown 文件的完整操作:读取、创建、更新、删除、列表。
 * slug 与文件路径互转:
 *   slug "notes/my-page" <-> wiki/notes/my-page.md
 */

import fs from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import path from 'node:path';
import type { WikiPage, WikiPageSummary } from '@llmwiki/shared';
import { PATHS } from '../types.js';
import { parseFrontmatter, stringifyFrontmatter } from './markdown.js';

// ============================================================================
// Slug / Path 互转
// ============================================================================

/** slug -> wiki/ 下绝对路径 */
export function slugToPath(slug: string): string {
  return path.join(PATHS.wikiDir, slug + '.md');
}

/** wiki/ 下绝对路径 -> slug */
export function pathToSlug(filePath: string): string {
  const relative = path.relative(PATHS.wikiDir, filePath);
  // 移除 .md 扩展名,统一使用正斜杠
  return relative.replace(/\.md$/i, '').replace(/\\/g, '/');
}

// ============================================================================
// CRUD 操作
// ============================================================================

/** 安全错误,带语义化消息 */
class FsError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'CONFLICT' | 'IO_ERROR',
  ) {
    super(message);
    this.name = 'FsError';
  }
}

/**
 * 读取 wiki 页面。
 * @returns WikiPage,若不存在则返回 null
 */
export async function readPage(slug: string): Promise<WikiPage | null> {
  const filePath = slugToPath(slug);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new FsError(`读取页面失败: ${slug}`, 'IO_ERROR');
  }

  const { frontmatter, body } = parseFrontmatter(raw);

  return {
    slug,
    path: filePath,
    frontmatter,
    body,
    raw,
  };
}

/**
 * 写入新 wiki 页面 (覆盖已存在的页面会报错)。
 * @param slug  页面标识
 * @param content 完整原始 Markdown 内容
 */
export async function writePage(slug: string, content: string): Promise<WikiPage> {
  const filePath = slugToPath(slug);

  // 检查是否已存在
  try {
    await fs.access(filePath);
    throw new FsError(`页面已存在: ${slug}`, 'CONFLICT');
  } catch (err: unknown) {
    if (err instanceof FsError) throw err;
    // ENOENT 是预期行为
  }

  // 确保父目录存在
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  await fs.writeFile(filePath, content, 'utf-8');

  const { frontmatter, body } = parseFrontmatter(content);
  return { slug, path: filePath, frontmatter, body, raw: content };
}

/**
 * 更新已有 wiki 页面。
 * @param slug    页面标识
 * @param updates 部分 frontmatter 字段 + 可选的正文
 */
export async function updatePage(
  slug: string,
  updates: { title?: string; body?: string; [key: string]: unknown },
): Promise<WikiPage> {
  const existing = await readPage(slug);
  if (!existing) {
    throw new FsError(`页面不存在: ${slug}`, 'NOT_FOUND');
  }

  const { body: _, ...updateFm } = updates;
  const mergedFm = { ...existing.frontmatter, ...updateFm };
  mergedFm.updated = new Date().toISOString();

  const newBody = updates.body ?? existing.body;
  const fmStr = stringifyFrontmatter(mergedFm);
  const newRaw = fmStr + '\n' + newBody;

  await fs.writeFile(existing.path, newRaw, 'utf-8');

  return {
    slug,
    path: existing.path,
    frontmatter: mergedFm,
    body: newBody,
    raw: newRaw,
  };
}

/**
 * 删除 wiki 页面 (同时删除文件)。
 */
export async function deletePage(slug: string): Promise<void> {
  const filePath = slugToPath(slug);

  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FsError(`页面不存在: ${slug}`, 'NOT_FOUND');
    }
    throw new FsError(`删除页面失败: ${slug}`, 'IO_ERROR');
  }
}

/**
 * 重命名/移动 wiki 页面。
 */
export async function renamePage(oldSlug: string, newSlug: string): Promise<WikiPage> {
  const oldPath = slugToPath(oldSlug);
  const newPath = slugToPath(newSlug);

  const newDir = path.dirname(newPath);
  await fs.mkdir(newDir, { recursive: true });

  try {
    await fs.rename(oldPath, newPath);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new FsError(`页面不存在: ${oldSlug}`, 'NOT_FOUND');
    }
    throw new FsError(`重命名页面失败: ${oldSlug} -> ${newSlug}`, 'IO_ERROR');
  }

  // 读取并返回新页面
  const page = await readPage(newSlug);
  if (!page) {
    throw new FsError(`重命名后读取失败: ${newSlug}`, 'IO_ERROR');
  }
  return page;
}

/**
 * 列出所有 wiki 页面摘要。
 */
export async function listPages(): Promise<WikiPageSummary[]> {
  const summaries: WikiPageSummary[] = [];
  await walkDir(PATHS.wikiDir, summaries);
  return summaries.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * 递归遍历 wiki 目录,收集所有 .md 文件的摘要。
 */
async function walkDir(dir: string, results: WikiPageSummary[]): Promise<void> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkDir(fullPath, results);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = pathToSlug(fullPath);
        try {
          const raw = await fs.readFile(fullPath, 'utf-8');
          const { frontmatter } = parseFrontmatter(raw);
          results.push({
            slug,
            title: frontmatter.title || slug,
            tags: frontmatter.tags ?? [],
            updated: frontmatter.updated,
          });
        } catch {
          // 跳过无法读取的文件
        }
      }
    }
  } catch {
    // wiki/ 目录不存在,返回空列表
    return;
  }
}

/** 检查页面是否存在 */
export async function pageExists(slug: string): Promise<boolean> {
  try {
    await fs.access(slugToPath(slug));
    return true;
  } catch {
    return false;
  }
}

export { FsError };
