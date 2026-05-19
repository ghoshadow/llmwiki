/**
 * Codebase Extractor — 模块深度提取器
 *
 * 读取单个模块的所有源文件，生成结构化的 Markdown 知识文档。
 * 支持 summary (概览) 和 detailed (含代码片段) 两种深度。
 */

import fs from "node:fs/promises";
import path from "node:path";
import { DEFAULT_SCAN_OPTIONS, extractTSJS, type SymbolInfo } from "./scanner.js";

// ============================================================
// Types
// ============================================================

export interface ExtractOptions {
  depth: "summary" | "detailed";
  includeCode: boolean;
  /** 指定要提取的文件列表（相对根目录的路径），不提供则递归读取整个目录 */
  files?: string[];
}

export const DEFAULT_EXTRACT_OPTIONS: ExtractOptions = {
  depth: "detailed",
  includeCode: true,
};

export interface ExtractedSymbol extends SymbolInfo {
  fullSignature: string;
  codeSnippet: string;
}

export interface CallRelation {
  from: string;
  to: string;
  kind: "import" | "extends" | "implements";
}

export interface ExtractResult {
  moduleName: string;
  root: string;
  files: string[];
  symbols: ExtractedSymbol[];
  callGraph: CallRelation[];
  externalDeps: string[];
  suggestedTags: string[];
  markdown: string;
}

// ============================================================
// 深度符号提取
// ============================================================

function extractFullSignatures(content: string, symbols: SymbolInfo[]): ExtractedSymbol[] {
  const lines = content.split("\n");
  return symbols.map((sym) => {
    const lineIdx = sym.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) {
      return { ...sym, fullSignature: sym.signature, codeSnippet: "" };
    }

    // 向上追踪 JSDoc
    let jsdocStart = lineIdx;
    for (let j = lineIdx - 1; j >= Math.max(0, lineIdx - 10); j--) {
      const prev = lines[j].trim();
      if (prev.startsWith("*") || prev.startsWith("/**") || prev.endsWith("*/")) {
        jsdocStart = j;
      } else if (prev !== "" && !prev.startsWith("//")) {
        break;
      }
    }

    // 向下追踪块结尾
    const defLine = lines[lineIdx].trim();
    let defEnd = lineIdx;
    if (defLine.includes("{") && !defLine.includes("}")) {
      let depth = 0;
      for (let j = lineIdx; j < Math.min(lines.length, lineIdx + 60); j++) {
        for (const ch of lines[j]) {
          if (ch === "{" || ch === "(") depth++;
          if (ch === "}" || ch === ")") depth--;
        }
        defEnd = j;
        if (depth <= 0 && j > lineIdx) break;
      }
    }

    const fullSignature = lines.slice(jsdocStart, defEnd + 1).join("\n").trim();
    const snippet = lines.slice(lineIdx, Math.min(lineIdx + 30, lines.length)).join("\n").trim();

    return { ...sym, fullSignature, codeSnippet: snippet.slice(0, 800) };
  });
}

// ============================================================
// 调用关系分析
// ============================================================

function extractCallRelations(content: string): CallRelation[] {
  const relations: CallRelation[] = [];
  for (const line of content.split("\n")) {
    const t = line.trim();
    const imp = t.match(/import\s*\{?\s*([^}]*?)\s*\}?\s*from\s*['"](.+?)['"]/);
    if (imp) {
      for (const name of imp[1].split(",").map((n) => n.trim().split(" as ")[0].trim()).filter(Boolean)) {
        relations.push({ from: "(this file)", to: `${imp[2]}#${name}`, kind: "import" });
      }
    }
    const ext = t.match(/(?:class|interface)\s+\w+\s+(?:extends|implements)\s+([\w.,\s]+)/);
    if (ext) {
      for (const p of ext[1].split(",").map((n) => n.trim())) {
        relations.push({ from: "(this class)", to: p, kind: "extends" });
      }
    }
  }
  return relations.slice(0, 100);
}

// ============================================================
// Markdown 生成
// ============================================================

function buildMarkdown(
  moduleName: string,
  root: string,
  files: string[],
  symbols: ExtractedSymbol[],
  relations: CallRelation[],
  externalDeps: string[],
  opts: ExtractOptions,
): string {
  const title = moduleName === "root" ? `Root Entry — ${path.basename(root)}` : moduleName;
  const md: string[] = [
    `# Module: ${title}`,
    "",
    `| Property | Value |`,
    `|----------|-------|`,
    `| Path | \`${moduleName}\` |`,
    `| Files | ${files.length} |`,
    `| Exported Symbols | ${symbols.length} |`,
    `| Language | ${guessLang(files)} |`,
    "",
    "## Files",
    "",
    ...files.map((f) => `- \`${f}\``),
    "",
  ];

  // 外部依赖
  const deps = [...new Set(externalDeps)].sort();
  if (deps.length > 0) {
    md.push("## External Dependencies", "");
    for (const d of deps.slice(0, 20)) md.push(`- \`${d}\``);
    md.push("");
  }

  // 导出 API
  if (symbols.length > 0) {
    md.push("## Exported API", "");

    const kindOrder = ["class", "interface", "type", "function", "enum", "const", "var", "unknown"];
    const byKind = new Map<string, ExtractedSymbol[]>();
    for (const s of symbols) byKind.set(s.kind, [...(byKind.get(s.kind) || []), s]);

    for (const kind of kindOrder) {
      const items = byKind.get(kind);
      if (!items || items.length === 0) continue;

      md.push(`### ${kind.charAt(0).toUpperCase() + kind.slice(1)}s`, "");

      for (const item of items.slice(0, 20)) {
        const marker = item.exported ? "`[exported]`" : "";
        md.push(`#### \`${item.name}\` ${marker}`, "");

        if (item.docComment) {
          md.push(`> ${item.docComment}`, "");
        }

        // 签名
        const sigLine = item.fullSignature.split("\n")[0];
        const lang = guessLang([item.name]);
        md.push("```" + lang);
        md.push(sigLine.slice(0, 150));
        md.push("```", "");

        // 代码片段
        if (opts.includeCode && opts.depth === "detailed" && item.codeSnippet.length > 20) {
          md.push("<details>");
          md.push("<summary>Show code</summary>", "");
          md.push("```" + lang);
          md.push(item.codeSnippet.slice(0, 500));
          md.push("```");
          md.push("</details>", "");
        }
      }
    }
  }

  // 关键关系
  if (relations.length > 0) {
    const key = relations.filter((r) => r.kind === "import" || r.kind === "extends").slice(0, 15);
    if (key.length > 0) {
      md.push("## Key Relationships", "");
      for (const r of key) md.push(`- ${r.from} → \`${r.to}\` _(${r.kind})_`);
      md.push("");
    }
  }

  // Tags
  const tags = suggestTags(moduleName, symbols, externalDeps);
  md.push("## Suggested Tags", "");
  md.push(tags.map((t) => `\`#${t}\``).join(" "));
  md.push("");

  return md.join("\n");
}

function guessLang(filesOrName: string[] | string): string {
  const sample = Array.isArray(filesOrName) ? filesOrName[0] || "" : filesOrName;
  if (/\.(ts|tsx|mjs|jsx?)$/i.test(sample)) return "typescript";
  if (/\.py$/i.test(sample)) return "python";
  if (/\.go$/i.test(sample)) return "go";
  if (/\.rs$/i.test(sample)) return "rust";
  return "typescript";
}

function suggestTags(
  moduleName: string,
  _symbols: ExtractedSymbol[],
  deps: string[],
): string[] {
  const tags = new Set<string>();
  for (const p of moduleName.split("/")) {
    if (p && p !== "src" && p !== "root") tags.add(p);
  }
  const depMap: Record<string, string> = {
    sqlite: "sqlite", vec: "vector-search", embed: "embedding",
    openai: "llm", ai: "llm", llm: "llm", llama: "local-llm",
    mermaid: "mermaid", opik: "tracing",
  };
  for (const d of deps) {
    for (const [k, v] of Object.entries(depMap)) {
      if (d.includes(k)) tags.add(v);
    }
  }
  for (const s of _symbols.slice(0, 30)) {
    const n = s.name.toLowerCase();
    if (n.includes("memory")) tags.add("memory");
    if (n.includes("recall")) tags.add("recall");
    if (n.includes("extract")) tags.add("extraction");
    if (n.includes("persona") || n.includes("profile")) tags.add("persona");
    if (n.includes("scene")) tags.add("scene");
    if (n.includes("hook")) tags.add("hooks");
    if (n.includes("config")) tags.add("config");
    if (n.includes("store")) tags.add("storage");
  }
  return [...tags].slice(0, 12);
}

// ============================================================
// 主入口
// ============================================================

export async function extractModule(
  root: string,
  modulePath: string,
  opts: Partial<ExtractOptions> = {},
): Promise<ExtractResult> {
  const options = { ...DEFAULT_EXTRACT_OPTIONS, ...opts };
  const scanOpts = DEFAULT_SCAN_OPTIONS;

  const files: string[] = [];
  const allSymbols: ExtractedSymbol[] = [];
  const allRelations: CallRelation[] = [];
  const allExternalDeps: string[] = [];

  // 核心：处理单个文件
  async function processFile(relPath: string): Promise<void> {
    const absPath = path.join(root, relPath);
    const ext = path.extname(relPath).toLowerCase();
    if (!scanOpts.includeExts.includes(ext)) return;

    let content: string;
    try { content = await fs.readFile(absPath, "utf-8"); } catch { return; }

    files.push(relPath);
    const { symbols, imports } = extractTSJS(content);
    allSymbols.push(...extractFullSignatures(content, symbols));
    allRelations.push(...extractCallRelations(content));
    for (const imp of imports) {
      if (!imp.startsWith(".") && !allExternalDeps.includes(imp)) {
        allExternalDeps.push(imp);
      }
    }
  }

  // 分支1：指定文件列表（尊重扫描器的模块边界）
  if (options.files && options.files.length > 0) {
    for (const relPath of options.files) {
      await processFile(relPath);
    }
  } else {
    // 分支2：递归目录（向后兼容）
    const fullPath = path.join(root, modulePath);
    let stat;
    try { stat = await fs.stat(fullPath); } catch {
      throw new Error(`Module path not found: ${fullPath}`);
    }

    async function processDir(dirPath: string, relPrefix: string) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const abs = path.join(dirPath, entry.name);
        const rel = relPrefix ? path.join(relPrefix, entry.name) : entry.name;
        if (entry.isDirectory()) {
          if (!scanOpts.ignore.includes(entry.name) && !entry.name.startsWith(".")) {
            await processDir(abs, rel);
          }
        } else if (entry.isFile()) {
          await processFile(rel);
        }
      }
    }

    if (stat.isDirectory()) {
      await processDir(fullPath, "");
    } else {
      await processFile(modulePath);
    }
  }

  const markdown = buildMarkdown(modulePath, root, files, allSymbols, allRelations, allExternalDeps, options);

  return {
    moduleName: modulePath,
    root,
    files,
    symbols: allSymbols,
    callGraph: allRelations,
    externalDeps: [...new Set(allExternalDeps)],
    suggestedTags: suggestTags(modulePath, allSymbols, allExternalDeps),
    markdown,
  };
}
