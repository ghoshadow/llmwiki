/**
 * index-parser.ts - index.md 解析与重建
 *
 * index.md 是一个层级化的知识索引文件,由 Markdown 标题组成。
 * 每个标题可以包含一个 wikilink 指向对应的 wiki 页面。
 *
 * 示例:
 *   # 计算机科学
 *   ## [[os|操作系统]]
 *   ## [[network|计算机网络]]
 *   ### [[tcp|TCP 协议]]
 */

import type { IndexNode, IndexTree } from '@llmwiki/shared';

// ============================================================================
// 解析
// ============================================================================

/** 匹配 markdown 标题行 (支持 # 到 ######) */
const HEADING_RE = /^(#{1,6})\s+(.+)$/;

/** 匹配 wikilink: [[target]] 或 [[target|alias]] */
const WIKILINK_INLINE_RE = /\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/;

interface RawHeading {
  level: number;
  rawText: string;
  title: string;
  slug?: string;
  line: number;
}

/**
 * 从 index.md 原始内容解析出 IndexNode 树。
 */
export function parseIndex(content: string): IndexNode[] {
  const lines = content.split('\n');
  const headings: RawHeading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const match = line.match(HEADING_RE);
    if (!match) continue;

    const level = match[1]!.length;
    const rawText = match[2]!.trim();
    const wlMatch = rawText.match(WIKILINK_INLINE_RE);

    headings.push({
      level,
      rawText,
      title: wlMatch ? (wlMatch[2] ?? wlMatch[1]!).trim() : rawText,
      slug: wlMatch ? wlMatch[1]!.trim() : undefined,
      line: i,
    });
  }

  return buildTree(headings);
}

/**
 * 将扁平的标题列表构建为树结构。
 */
function buildTree(headings: RawHeading[]): IndexNode[] {
  const roots: IndexNode[] = [];
  // 用栈追踪各层级的父节点,索引 = level
  const stack: IndexNode[] = [];

  for (const h of headings) {
    const node: IndexNode = {
      title: h.title,
      slug: h.slug,
      level: h.level,
      children: [],
    };

    // 弹出所有层级 >= 当前层级的节点
    while (stack.length > 0 && stack[stack.length - 1]!.level >= h.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1]!.children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

// ============================================================================
// 完整性分析
// ============================================================================

/**
 * 收集树中所有 slug (递归)。
 */
function collectSlugs(nodes: IndexNode[]): string[] {
  const slugs: string[] = [];
  const walk = (list: IndexNode[]) => {
    for (const n of list) {
      if (n.slug) slugs.push(n.slug);
      walk(n.children);
    }
  };
  walk(nodes);
  return slugs;
}

/**
 * 构建 IndexTree,包含完整性检查结果。
 *
 * @param content       index.md 原始内容
 * @param existingSlugs wiki/ 中实际存在的所有 slug
 */
export function buildIndexTree(content: string, existingSlugs: string[]): IndexTree {
  const roots = parseIndex(content);
  const indexSlugs = collectSlugs(roots);
  const existingSet = new Set(existingSlugs);

  const orphanRefs = indexSlugs.filter((s) => !existingSet.has(s));
  const indexSet = new Set(indexSlugs);
  const missingFromIndex = existingSlugs.filter((s) => !indexSet.has(s));

  return { roots, orphanRefs, missingFromIndex };
}

// ============================================================================
// 重建 / 序列化
// ============================================================================

/**
 * 将 IndexNode 树序列化为 markdown 文本。
 */
export function rebuildIndex(nodes: IndexNode[]): string {
  const lines: string[] = [];
  const walk = (list: IndexNode[]) => {
    for (const node of list) {
      const prefix = '#'.repeat(node.level);
      if (node.slug) {
        const display = node.title !== node.slug ? `|${node.title}` : '';
        lines.push(`${prefix} [[${node.slug}${display}]]`);
      } else {
        lines.push(`${prefix} ${node.title}`);
      }
      // 标题后空行
      lines.push('');
      walk(node.children);
    }
  };
  walk(nodes);
  return lines.join('\n').trimEnd() + '\n';
}

// ============================================================================
// 动态添加
// ============================================================================

/**
 * 向 index.md 中动态插入一条索引项。
 *
 * @param content      当前 index.md 内容
 * @param title        新节点标题
 * @param slug         关联的 wiki slug
 * @param parentTitle  父节点标题 (若要在某个节点下插入子项,否则追加到根)
 * @returns 修改后的完整内容
 */
export function addToIndex(
  content: string,
  title: string,
  slug: string,
  parentTitle?: string,
): string {
  const lines = content.split('\n');
  const headings: RawHeading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const match = line.match(HEADING_RE);
    if (!match) continue;

    const level = match[1]!.length;
    const rawText = match[2]!.trim();
    const wlMatch = rawText.match(WIKILINK_INLINE_RE);

    headings.push({
      level,
      rawText,
      title: wlMatch ? (wlMatch[2] ?? wlMatch[1]!).trim() : rawText,
      slug: wlMatch ? wlMatch[1]!.trim() : undefined,
      line: i,
    });
  }

  if (headings.length === 0) {
    // 空索引,直接追加
    const newLine = `# [[${slug}|${title}]]`;
    return (content.trimEnd() + '\n\n' + newLine + '\n');
  }

  // 找到父节点位置
  let insertAfterLine = -1;
  let childLevel = 1;

  if (parentTitle) {
    for (const h of headings) {
      if (h.title === parentTitle) {
        insertAfterLine = h.line;
        childLevel = h.level + 1;
        // 找到该节点最后一个子孙的结束行
        for (let j = headings.indexOf(h) + 1; j < headings.length; j++) {
          if (headings[j]!.level <= h.level) break;
          insertAfterLine = Math.max(
            insertAfterLine,
            headings[j]!.line + (lines[headings[j]!.line + 1] === '' ? 1 : 0),
          );
        }
        break;
      }
    }
  }

  if (insertAfterLine === -1) {
    // 未找到父节点或未指定,追加到末尾
    insertAfterLine = lines.length - 1;
    // 找到最后一个标题作为参考
    if (headings.length > 0) {
      const last = headings[headings.length - 1]!;
      insertAfterLine = last.line;
      childLevel = last.level;
      // 确保后面有空行
      if (lines[insertAfterLine + 1] === '') insertAfterLine++;
    }
  }

  const prefix = '#'.repeat(Math.min(childLevel, 6));
  const newLine = `${prefix} [[${slug}|${title}]]`;

  const newLines = [...lines];
  newLines.splice(insertAfterLine + 1, 0, '', newLine);

  return newLines.join('\n').trimEnd() + '\n';
}

/**
 * 从 index.md 中移除指定 slug 的索引项。
 */
export function removeFromIndex(content: string, slug: string): string {
  const lines = content.split('\n');
  const slugPattern = `[[${slug}`;

  const filtered = lines.filter((line) => {
    const match = line.match(HEADING_RE);
    if (!match) return true;
    return !match[2]!.includes(slugPattern);
  });

  // 清理多余空行
  const cleaned: string[] = [];
  let prevEmpty = false;
  for (const line of filtered) {
    if (line === '') {
      if (!prevEmpty) cleaned.push(line);
      prevEmpty = true;
    } else {
      cleaned.push(line);
      prevEmpty = false;
    }
  }

  return cleaned.join('\n').trimEnd() + '\n';
}
