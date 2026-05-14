/**
 * MCP Server 内部类型 + PATHS 常量 (占位)
 *
 * Phase 1 脚手架阶段:仅保留导出占位,实际实现见后续阶段。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** 仓库根目录 (mcp-server/src -> mcp-server -> 仓库根) */
const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * 关键路径常量
 */
export const PATHS = {
  repoRoot: REPO_ROOT,
  wikiDir: path.join(REPO_ROOT, 'wiki'),
  rawDir: path.join(REPO_ROOT, 'raw'),
  indexFile: path.join(REPO_ROOT, 'index.md'),
  logFile: path.join(REPO_ROOT, 'log.md'),
} as const;
