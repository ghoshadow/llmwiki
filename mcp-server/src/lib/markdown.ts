/**
 * markdown.ts - frontmatter + wikilink 解析
 *
 * 提供 Obsidian 兼容的 frontmatter (YAML) 与 wikilink ([[target|alias]]) 解析能力。
 */

import type { WikiFrontmatter, WikiLink } from '@llmwiki/shared';

// ============================================================================
// Frontmatter 解析
// ============================================================================

const FM_DELIM = '---';

/**
 * 简单的 YAML frontmatter 标量解析。
 * 仅处理: 字符串、字符串数组、单层键值对。
 * 不依赖外部 YAML 库以保持零依赖。
 */
function parseYamlScalar(raw: string): unknown {
  const trimmed = raw.trim();

  // 数组: [a, b, c] 或换行列表
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1);
    if (inner.trim() === '') return [];
    return inner.split(',').map((s) => s.trim().replace(/^['"](.*)['"]$/, '$1'));
  }

  // 换行列表 (以 - 开头)
  if (trimmed.startsWith('- ')) {
    return trimmed
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((s) => s.length > 0)
      .map((s) => s.replace(/^['"](.*)['"]$/, '$1'));
  }

  // 带引号的字符串
  const quoted = trimmed.match(/^['"](.*)['"]$/);
  if (quoted) return quoted[1];

  // 布尔值
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // 数字
  const num = Number(trimmed);
  if (!Number.isNaN(num) && trimmed !== '') return num;

  return trimmed;
}

/**
 * 从原始 markdown 文本中提取 frontmatter 与正文。
 * 若无 frontmatter,则返回空的 frontmatter 对象。
 */
export function parseFrontmatter(raw: string): {
  frontmatter: WikiFrontmatter;
  body: string;
} {
  if (!raw.startsWith(FM_DELIM + '\n') && !raw.startsWith(FM_DELIM + '\r\n')) {
    return { frontmatter: { title: '' }, body: raw };
  }

  const endIdx = raw.indexOf('\n' + FM_DELIM, 4);
  if (endIdx === -1) {
    // 只有开分隔符,视为无效,全部作正文
    return { frontmatter: { title: '' }, body: raw };
  }

  const fmBlock = raw.slice(4, endIdx);
  const body = raw.slice(endIdx + 5).trimStart();

  const frontmatter: WikiFrontmatter = { title: '' };
  const lines = fmBlock.split('\n');

  let currentKey: string | null = null;
  let currentValue = '';

  for (const line of lines) {
    // 多行数组延续
    if (currentKey && /^\s{2,}-\s/.test(line)) {
      currentValue += '\n' + line;
      continue;
    }

    // 提交之前的键
    if (currentKey) {
      (frontmatter as Record<string, unknown>)[currentKey] = parseYamlScalar(currentValue);
      currentKey = null;
      currentValue = '';
    }

    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s?(.*)/);
    if (match) {
      const [, key, value] = match;
      if (value.trim() === '') {
        // 可能为多行值
        currentKey = key;
        currentValue = '';
      } else {
        (frontmatter as Record<string, unknown>)[key] = parseYamlScalar(value);
      }
    }
  }

  // 提交最后一个键
  if (currentKey) {
    (frontmatter as Record<string, unknown>)[currentKey] = parseYamlScalar(currentValue);
  }

  return { frontmatter, body };
}

/**
 * 将 WikiFrontmatter 序列化为 YAML frontmatter 字符串 (含分隔符)。
 */
export function stringifyFrontmatter(fm: WikiFrontmatter): string {
  const lines: string[] = [FM_DELIM];

  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${String(item)}`);
        }
      }
    } else if (typeof value === 'string') {
      // 包含特殊字符时加引号
      if (/[:"{}[\]&*#?|>!%@`,\s]/.test(value) || value === '') {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push(FM_DELIM);
  return lines.join('\n');
}

// ============================================================================
// Wikilink 解析
// ============================================================================

const WIKILINK_RE = /\[\[([^\]|#]+?)(?:[|#]([^\]]+))?\]\]/g;

/**
 * 从文本中提取所有 wikilink。
 * 支持两种语法:
 *   - [[target]]       简单引用
 *   - [[target|alias]] 带显示别名
 *
 * 注意: resolved / resolvedSlug 字段由调用方填充,此处仅标记为未解析。
 */
export function parseWikiLinks(text: string): WikiLink[] {
  const links: WikiLink[] = [];
  let match: RegExpExecArray | null;

  // 重置正则
  WIKILINK_RE.lastIndex = 0;

  while ((match = WIKILINK_RE.exec(text)) !== null) {
    const target = match[1]!.trim();
    const alias = match[2]?.trim();

    links.push({
      target,
      alias: alias || undefined,
      start: match.index,
      end: match.index + match[0].length,
      resolved: false,
    });
  }

  return links;
}

/** 安全版本的 parseWikiLinks,捕获异常并返回空数组。 */
export function parseWikiLinksSafe(text: string): WikiLink[] {
  try {
    return parseWikiLinks(text);
  } catch {
    return [];
  }
}

/**
 * 解析完整 Wiki 页面的原始内容,同时提取 frontmatter 与 wikilink。
 */
export function parseWikiPage(
  raw: string,
  slug: string,
  filePath: string,
): {
  frontmatter: WikiFrontmatter;
  body: string;
  links: WikiLink[];
} {
  const { frontmatter, body } = parseFrontmatter(raw);
  const links = parseWikiLinks(body);
  return { frontmatter, body, links };
}
