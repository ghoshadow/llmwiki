/**
 * log-parser.ts - log.md 条目管理
 *
 * log.md 记录所有 wiki 操作的完整历史,格式如下:
 *
 *   # 操作日志
 *
 *   - 2026-05-14T10:30:00.000Z ingest raw/doc.pdf | 从 PDF 文档摄入
 *     Details line 1
 *     Details line 2
 *
 * 每条日志以 "- " 开头,包含时间戳、操作类型、目标对象和摘要。
 * 详细信息以缩进行形式跟随。
 */

import type { LogEntry, LogOperation } from '@llmwiki/shared';

// ============================================================================
// 解析
// ============================================================================

const LOG_LINE_RE = /^-\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)\s+(\w+)\s+(\S+?)\s*\|\s*(.+)$/;

const VALID_OPERATIONS: Set<string> = new Set([
  'ingest',
  'create',
  'update',
  'delete',
  'rename',
  'merge',
  'lint',
  'reindex',
]);

/**
 * 将 log.md 原始内容解析为条目数组。
 */
export function parseLog(content: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;

    const match = line.match(LOG_LINE_RE);
    if (!match) {
      i++;
      continue;
    }

    const [, timestamp, operation, target, summary] = match;

    // 验证 operation
    if (!VALID_OPERATIONS.has(operation!)) {
      i++;
      continue;
    }

    // 收集后续缩进行作为 details
    const detailsLines: string[] = [];
    i++;
    while (i < lines.length && lines[i]!.startsWith('  ') && lines[i]!.trim() !== '') {
      detailsLines.push(lines[i]!.trim());
      i++;
    }

    entries.push({
      timestamp: timestamp!,
      operation: operation as LogOperation,
      target: target!,
      summary: summary!,
      details: detailsLines.length > 0 ? detailsLines.join('\n') : undefined,
    });
  }

  return entries;
}

// ============================================================================
// 追加
// ============================================================================

/**
 * 向 log.md 追加一条新条目,返回修改后的完整内容。
 */
export function appendLogEntry(content: string, entry: LogEntry): string {
  let line = `- ${entry.timestamp} ${entry.operation} ${entry.target} | ${entry.summary}`;

  if (entry.details) {
    const detailLines = entry.details.split('\n').map((d) => `  ${d}`);
    line += '\n' + detailLines.join('\n');
  }

  const trimmed = content.trimEnd();
  return (trimmed ? trimmed + '\n' + line : line) + '\n';
}

/**
 * 批量追加日志条目。
 */
export function appendLogEntries(content: string, entries: LogEntry[]): string {
  let result = content;
  for (const entry of entries) {
    result = appendLogEntry(result, entry);
  }
  return result;
}

// ============================================================================
// 查询
// ============================================================================

export interface LogFilter {
  operation?: LogOperation;
  target?: string;
  /** 返回最近的 N 条,按时间倒序 */
  limit?: number;
}

/**
 * 按条件过滤日志条目。
 */
export function queryLog(content: string, filter: LogFilter): LogEntry[] {
  let entries = parseLog(content);

  if (filter.operation) {
    entries = entries.filter((e) => e.operation === filter.operation);
  }

  if (filter.target) {
    const lower = filter.target.toLowerCase();
    entries = entries.filter((e) => e.target.toLowerCase().includes(lower));
  }

  // 默认按时间戳降序
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  if (filter.limit && filter.limit > 0) {
    entries = entries.slice(0, filter.limit);
  }

  return entries;
}

/**
 * 获取日志中最新的时间戳。
 * 用于生成新的日志条目时确定顺序。
 */
export function getLatestTimestamp(content: string): string | null {
  const entries = parseLog(content);
  if (entries.length === 0) return null;
  return entries.reduce((latest, e) =>
    e.timestamp > latest ? e.timestamp : latest, entries[0]?.timestamp ?? '',
  );
}
