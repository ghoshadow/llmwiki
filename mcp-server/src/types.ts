/**
 * MCP Server 内部类型 + PATHS 常量
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
  indexFile: path.join(REPO_ROOT, 'wiki', 'index.md'),
  logFile: path.join(REPO_ROOT, 'wiki', 'log.md'),
} as const;

/** MCP 工具返回结构 */
export interface ToolSuccess<T> {
  success: true;
  data: T;
}

export interface ToolError {
  success: false;
  error: string;
}

export type ToolResult<T> = ToolSuccess<T> | ToolError;

/** MCP 工具定义 */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}
