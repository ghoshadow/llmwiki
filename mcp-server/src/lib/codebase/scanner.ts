/**
 * Codebase Scanner — 代码库扫描器
 *
 * 遍历目录树，识别模块边界，提取关键符号，生成知识提取计划。
 * 语言无关的文件分组，按扩展名选择符号解析策略。
 */

import fs from "node:fs/promises";
import path from "node:path";

// ============================================================
// Types
// ============================================================

export interface ScanOptions {
  /** 要忽略的目录/文件模式 */
  ignore: string[];
  /** 关注的扩展名 */
  includeExts: string[];
  /** 每个模块最多生成的 wiki 页面建议数 */
  maxPagesPerModule: number;
}

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  ignore: [
    "node_modules",
    ".git",
    "dist",
    ".next",
    "build",
    "__pycache__",
    ".turbo",
    ".cache",
    "coverage",
    ".nyc_output",
  ],
  includeExts: [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".go",
    ".rs",
    ".java",
    ".rb",
    ".ex",
    ".exs",
  ],
  maxPagesPerModule: 8,
};

export interface SymbolInfo {
  name: string;
  kind: "function" | "class" | "interface" | "type" | "enum" | "const" | "var" | "unknown";
  signature: string; // 简化的签名 (第一行)
  docComment: string; // JSDoc / docstring 摘要
  line: number;
  exported: boolean;
}

export interface FileInfo {
  path: string; // 相对根目录的路径
  ext: string;
  size: number;
  lines: number;
  symbols: SymbolInfo[];
  imports: string[]; // 导入的其他模块路径
}

export interface ModuleInfo {
  name: string; // 模块名 (目录路径)
  files: FileInfo[];
  exports: SymbolInfo[]; // 该模块导出的所有符号
  internalDeps: string[]; // 依赖的同项目内其他模块
  externalDeps: string[]; // 外部包依赖
  suggestedPages: number; // 建议创建的 wiki 页面数
}

export interface ScanResult {
  root: string;
  modules: ModuleInfo[];
  stats: {
    totalFiles: number;
    totalLines: number;
    totalModules: number;
    totalSymbols: number;
  };
  extractionPlan: string; // 给 Claude Agent 的执行计划文本
}

// ============================================================
// 扩展名 → 语言标记
// ============================================================

const EXT_LANG: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript (React)",
  ".js": "JavaScript",
  ".jsx": "JavaScript (React)",
  ".mjs": "JavaScript (ESM)",
  ".cjs": "JavaScript (CJS)",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".rb": "Ruby",
  ".ex": "Elixir",
  ".exs": "Elixir (Script)",
};

// ============================================================
// 符号提取器 (按语言注册)
// ============================================================

type SymbolExtractor = (content: string, filePath: string) => { symbols: SymbolInfo[]; imports: string[] };

/**
 * TypeScript / JavaScript 符号提取
 */
export function extractTSJS(content: string): { symbols: SymbolInfo[]; imports: string[] } {
  const symbols: SymbolInfo[] = [];
  const imports: string[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // JSDoc 注释收集 (向前看 5 行)
    let docComment = "";
    for (let j = Math.max(0, i - 5); j < i; j++) {
      const prev = lines[j].trim();
      if (prev.startsWith("/**") || prev.startsWith("*") || prev.startsWith("*/")) {
        const text = prev.replace(/^\/?\*+\/?\s*/, "").replace(/\s*\*\/$/, "").trim();
        if (text && !text.startsWith("@")) {
          docComment = text.slice(0, 200);
        }
      }
    }

    // 导入检测
    const importFrom = line.match(/from\s+['"](.+?)['"]/);
    if (importFrom) {
      const target = importFrom[1];
      if (target.startsWith(".")) {
        imports.push(target);
      } else {
        // 外部包：取包名 (scoped 或 plain)
        const pkg = target.startsWith("@") ? target.split("/").slice(0, 2).join("/") : target.split("/")[0];
        if (!imports.includes(pkg)) imports.push(pkg);
      }
    }

    // 导出检测
    let exported = false;
    let defLine = line;
    const exportMatch = line.match(
      /^export\s+(const|let|var|function|class|interface|type|enum|abstract\s+class|default\s+class|default\s+function)\s+(\w+)/
    );
    if (exportMatch) {
      exported = true;
    } else if (/^export\s*\{/.test(line)) {
      // named export block: export { foo, bar } — skip for now
      continue;
    } else if (/^export\s+default/.test(line)) {
      exported = true;
      // 尝试从后续行或同一行提取名称
      const nameMatch = line.match(/export\s+default\s+(?:function|class)\s+(\w+)/);
      if (nameMatch) {
        symbols.push({
          name: nameMatch[1],
          kind: line.includes("class") ? "class" : "function",
          signature: line.slice(0, 120),
          docComment,
          line: i + 1,
          exported: true,
        });
      }
      continue;
    }

    if (exportMatch) {
      const kind = exportMatch[1] === "abstract class" ? "class" : exportMatch[1] as SymbolInfo["kind"];
      const name = exportMatch[2];
      symbols.push({ name, kind, signature: line.slice(0, 120), docComment, line: i + 1, exported });
    }

    // 非导出但重要的声明 (内部 interface/type 常用于类型定义)
    const declMatch = line.match(/^(?:export\s+)?(interface|type)\s+(\w+)\s*[=<{]/);
    if (declMatch) {
      const name = declMatch[2];
      const already = symbols.find((s) => s.name === name && s.kind === declMatch[1]);
      if (!already) {
        symbols.push({
          name,
          kind: declMatch[1] as "interface" | "type",
          signature: line.slice(0, 120),
          docComment,
          line: i + 1,
          exported: line.startsWith("export"),
        });
      }
    }
  }

  return { symbols, imports };
}

/**
 * Python 符号提取
 */
function extractPython(content: string): { symbols: SymbolInfo[]; imports: string[] } {
  const symbols: SymbolInfo[] = [];
  const imports: string[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Docstring
    let docComment = "";
    for (let j = Math.max(0, i - 3); j < i; j++) {
      const prev = lines[j].trim();
      if (prev.startsWith('"""') || prev.startsWith("'''")) {
        docComment = prev.replace(/^["']{3}\s*/, "").replace(/\s*["']{3}$/, "").slice(0, 200);
      }
    }

    // 导入检测
    const importMatch = line.match(/^(?:from|import)\s+([\w.]+)/);
    if (importMatch) {
      const pkg = importMatch[1];
      if (!imports.includes(pkg)) imports.push(pkg);
    }

    // Class / Function 声明
    const defMatch = line.match(/^(?:async\s+)?(?:def|class)\s+(\w+)/);
    if (defMatch) {
      const name = defMatch[1];
      const isPrivate = name.startsWith("_");
      symbols.push({
        name,
        kind: line.includes("class") ? "class" : "function",
        signature: line.slice(0, 120),
        docComment,
        line: i + 1,
        exported: !isPrivate,
      });
    }
  }

  return { symbols, imports };
}

/**
 * Go 符号提取
 */
function extractGo(content: string): { symbols: SymbolInfo[]; imports: string[] } {
  const symbols: SymbolInfo[] = [];
  const imports: string[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 导入检测
    const importMatch = line.match(/"(.+)"/);
    if (line.startsWith("import") || (importMatch && lines.slice(Math.max(0, i - 3), i + 1).some((l) => l.includes("import")))) {
      if (importMatch) {
        const pkg = importMatch[1];
        if (!imports.includes(pkg)) imports.push(pkg);
      }
    }

    // 类型/函数声明
    const typeMatch = line.match(/^type\s+(\w+)\s+/);
    if (typeMatch) {
      const name = typeMatch[1];
      symbols.push({
        name,
        kind: "type",
        signature: line.slice(0, 120),
        docComment: "",
        line: i + 1,
        exported: /^[A-Z]/.test(name),
      });
    }

    const funcMatch = line.match(/^func\s+(?:\(.*?\)\s+)?(\w+)/);
    if (funcMatch) {
      const name = funcMatch[1];
      symbols.push({
        name,
        kind: name === "init" ? "function" : "function",
        signature: line.slice(0, 120),
        docComment: "",
        line: i + 1,
        exported: /^[A-Z]/.test(name),
      });
    }
  }

  return { symbols, imports };
}

// 符号提取器注册表
const EXTRACTORS: Record<string, SymbolExtractor> = {
  ".ts": extractTSJS,
  ".tsx": extractTSJS,
  ".js": extractTSJS,
  ".jsx": extractTSJS,
  ".mjs": extractTSJS,
  ".cjs": extractTSJS,
  ".py": extractPython,
  ".go": extractGo,
  ".rs": extractTSJS, // Rust 语法类似，先用简版
};

// ============================================================
// 文件/模块扫描
// ============================================================

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

async function scanFile(
  root: string,
  filePath: string,
  opts: ScanOptions,
): Promise<FileInfo | null> {
  const ext = path.extname(filePath).toLowerCase();
  if (!opts.includeExts.includes(ext)) return null;

  const absPath = path.join(root, filePath);
  let content: string;
  try {
    content = await fs.readFile(absPath, "utf-8");
  } catch {
    return null; // 跳过无法读取的文件
  }

  const stat = await fs.stat(absPath);
  const lines = content.split("\n").length;
  const extractor = EXTRACTORS[ext] || extractTSJS;
  const { symbols, imports } = extractor(content, filePath);

  return {
    path: filePath,
    ext,
    size: stat.size,
    lines,
    symbols,
    imports,
  };
}

async function scanDirectory(
  root: string,
  dir: string,
  opts: ScanOptions,
): Promise<{ files: FileInfo[]; subdirs: string[] }> {
  const fullPath = path.join(root, dir);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const files: FileInfo[] = [];
  const subdirs: string[] = [];

  for (const entry of entries) {
    const relPath = dir ? path.join(dir, entry.name) : entry.name;

    if (entry.isDirectory()) {
      if (opts.ignore.includes(entry.name) || entry.name.startsWith(".")) continue;
      subdirs.push(relPath);
    } else if (entry.isFile()) {
      if (opts.ignore.some((p) => entry.name.includes(p))) continue;
      const fileInfo = await scanFile(root, relPath, opts);
      if (fileInfo) files.push(fileInfo);
    }
  }

  return { files, subdirs };
}

/**
 * 将所有文件按目录结构分组为模块。
 * 规则：
 *   - 每个有源文件的子目录为一个模块
 *   - 根目录文件归入 "root" 模块
 *   - 嵌套过深 (≥3 级) 的叶子目录向上合并到最近的浅目录
 */
function groupIntoModules(rootFiles: FileInfo[], dirFiles: Map<string, FileInfo[]>, maxDepth = 2): ModuleInfo[] {
  const modules: ModuleInfo[] = [];

  // 根目录模块
  if (rootFiles.length > 0) {
    const exports: SymbolInfo[] = [];
    const internalDeps: string[] = [];
    const externalDeps: string[] = [];
    for (const f of rootFiles) {
      exports.push(...f.symbols.filter((s) => s.exported));
      for (const imp of f.imports) {
        if (imp.startsWith(".")) {
          const resolved = path.normalize(path.join(path.dirname(f.path), imp));
          if (!internalDeps.includes(resolved)) internalDeps.push(resolved);
        } else {
          if (!externalDeps.includes(imp)) externalDeps.push(imp);
        }
      }
    }
    modules.push({
      name: "root",
      files: rootFiles,
      exports,
      internalDeps: [...new Set(internalDeps)].map((d) => d.split("/").slice(0, maxDepth + 1).join("/")),
      externalDeps: [...new Set(externalDeps)],
      suggestedPages: Math.min(Math.ceil(rootFiles.length / 3), 5),
    });
  }

  // 子目录模块
  for (const [dir, files] of dirFiles) {
    if (files.length === 0) continue;
    const parts = dir.split("/");
    // 嵌套过深：取前 maxDepth 级
    const moduleName = parts.length > maxDepth ? parts.slice(0, maxDepth).join("/") : dir;

    // 合并到已存在的模块
    const existing = modules.find((m) => m.name === moduleName);
    const exports: SymbolInfo[] = [];
    const internalDeps: string[] = [];
    const externalDeps: string[] = [];

    for (const f of files) {
      exports.push(...f.symbols.filter((s) => s.exported));
      for (const imp of f.imports) {
        if (imp.startsWith(".")) {
          const resolved = path.normalize(path.join(path.dirname(f.path), imp));
          if (!internalDeps.includes(resolved)) internalDeps.push(resolved);
        } else {
          if (!externalDeps.includes(imp)) externalDeps.push(imp);
        }
      }
    }

    const cleanDeps = [...new Set(internalDeps)].map((d) => {
      const p = d.split("/").slice(0, maxDepth + 1).join("/");
      return p || d;
    });

    if (existing) {
      existing.files.push(...files);
      existing.exports.push(...exports);
      for (const d of cleanDeps) {
        if (!existing.internalDeps.includes(d)) existing.internalDeps.push(d);
      }
      for (const d of externalDeps) {
        if (!existing.externalDeps.includes(d)) existing.externalDeps.push(d);
      }
      existing.suggestedPages = Math.min(Math.ceil(existing.files.length / 3), 8);
    } else {
      modules.push({
        name: moduleName,
        files,
        exports,
        internalDeps: cleanDeps,
        externalDeps: [...new Set(externalDeps)],
        suggestedPages: Math.min(Math.ceil(files.length / 3), 8),
      });
    }
  }

  // 按名称排序
  modules.sort((a, b) => a.name.localeCompare(b.name));
  return modules;
}

// ============================================================
// 提取计划生成
// ============================================================

function buildExtractionPlan(root: string, modules: ModuleInfo[]): string {
  const lines: string[] = [
    `# Codebase Extraction Plan for: ${root}`,
    "",
    `Total modules identified: **${modules.length}**`,
    "",
    "## Module List (by suggested extraction order)",
    "",
    "| # | Module | Files | Symbols | Suggested Pages | Key Deps |",
    "|---|--------|-------|---------|-----------------|----------|",
  ];

  modules.forEach((m, i) => {
    const keyDeps = m.internalDeps.filter((d) => d !== m.name).slice(0, 3).join(", ") || "none";
    lines.push(
      `| ${i + 1} | \`${m.name}\` | ${m.files.length} | ${m.exports.length} | ${m.suggestedPages} | ${keyDeps} |`,
    );
  });

  lines.push("");
  lines.push("## Extraction Strategy");
  lines.push("");
  lines.push("1. **Start with root/architecture files** — understand the high-level structure");
  lines.push("2. **Extract leaf modules first** — modules with fewest internal dependencies");
  lines.push("3. **Work inward to core modules** — save the most depended-on modules for last");
  lines.push("4. **For each module**, use `codebase_extract_module` to generate a structured knowledge page");
  lines.push("5. **After all modules**, use `codebase_index` to build the architecture overview index");
  lines.push("");
  lines.push("## Wiki Page Structure (per module)");
  lines.push("");
  lines.push("Each module wiki page should include:");
  lines.push("- Module purpose & responsibility");
  lines.push("- Key types and interfaces");
  lines.push("- Public API / exported symbols");
  lines.push("- Data flow and call graph");
  lines.push("- Dependencies (internal + external)");
  lines.push("- Usage examples if available in tests");

  return lines.join("\n");
}

// ============================================================
// 主入口
// ============================================================

export async function scanCodebase(
  root: string,
  opts: Partial<ScanOptions> = {},
): Promise<ScanResult> {
  const options = { ...DEFAULT_SCAN_OPTIONS, ...opts };

  // 验证根目录
  try {
    const stat = await fs.stat(root);
    if (!stat.isDirectory()) throw new Error("Not a directory");
  } catch (err) {
    throw new Error(`Cannot access root directory "${root}": ${err instanceof Error ? err.message : err}`);
  }

  // 递归扫描所有文件
  const allFiles: FileInfo[] = [];
  const dirFileMap = new Map<string, FileInfo[]>();
  const pendingDirs = [""];

  while (pendingDirs.length > 0) {
    const dir = pendingDirs.shift()!;
    const { files, subdirs } = await scanDirectory(root, dir, options);

    if (dir === "") {
      allFiles.push(...files);
    } else {
      dirFileMap.set(dir, files);
    }

    pendingDirs.push(...subdirs);
  }

  // 分组为模块
  const modules = groupIntoModules(allFiles, dirFileMap);

  // 统计数据
  const totalFiles = modules.reduce((s, m) => s + m.files.length, 0);
  const totalLines = modules.reduce((s, m) => s + m.files.reduce((l, f) => l + f.lines, 0), 0);
  const totalSymbols = modules.reduce((s, m) => s + m.exports.length, 0);

  return {
    root,
    modules,
    stats: {
      totalFiles,
      totalLines,
      totalModules: modules.length,
      totalSymbols,
    },
    extractionPlan: buildExtractionPlan(root, modules),
  };
}
