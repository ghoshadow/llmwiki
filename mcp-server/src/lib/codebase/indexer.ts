/**
 * Codebase Indexer — 架构总览索引构建器
 *
 * 在所有模块提取完成后，生成交叉链接的架构总览索引页。
 * 包含模块依赖图、分类映射、Mermaid 图表。
 */

import type { ModuleInfo, ScanResult } from "./scanner.js";

// ============================================================
// Types
// ============================================================

export interface IndexNode {
  name: string;
  category: string;
  files: number;
  symbols: number;
  slug: string;
}

export interface IndexEdge {
  from: string;
  to: string;
}

export interface IndexGraph {
  nodes: IndexNode[];
  edges: IndexEdge[];
}

export interface IndexResult {
  root: string;
  graph: IndexGraph;
  categories: Map<string, IndexNode[]>;
  indexMarkdown: string;
}

// ============================================================
// 分类逻辑
// ============================================================

const CATEGORY_RULES: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /^root$/i, category: "Entry Point" },
  { pattern: /^(src\/)?core\b/i, category: "Core Logic" },
  { pattern: /\bstore\b/i, category: "Storage" },
  { pattern: /\bhooks?\b/i, category: "Hooks / Events" },
  { pattern: /\badapters?\b/i, category: "Adapters" },
  { pattern: /\brecord\b/i, category: "Data Records" },
  { pattern: /\bconversation\b/i, category: "Data Records" },
  { pattern: /\bscene\b/i, category: "Scene Management" },
  { pattern: /\bpersona\b/i, category: "Persona / Profile" },
  { pattern: /\bprofile\b/i, category: "Persona / Profile" },
  { pattern: /\bprompts?\b/i, category: "Prompts" },
  { pattern: /\b(offload|unload)\b/i, category: "Offload Pipeline" },
  { pattern: /\butils?\b/i, category: "Utilities" },
  { pattern: /\bcli\b/i, category: "CLI" },
  { pattern: /\bgateway\b/i, category: "Gateway / API" },
  { pattern: /\bseed\b/i, category: "Seed Data" },
  { pattern: /\bplugin\b/i, category: "Plugin" },
  { pattern: /\btools?\b/i, category: "MCP Tools" },
  { pattern: /\breport\b/i, category: "Reporting" },
];

function categorize(name: string): string {
  for (const { pattern, category } of CATEGORY_RULES) {
    if (pattern.test(name)) return category;
  }
  return "Other";
}

function moduleToSlug(name: string): string {
  return name
    .replace(/^src\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9-]/gi, "")
    .toLowerCase();
}

// ============================================================
// 依赖图构建
// ============================================================

function buildGraph(modules: ModuleInfo[]): IndexGraph {
  const nodes: IndexNode[] = modules.map((m) => ({
    name: m.name,
    category: categorize(m.name),
    files: m.files.length,
    symbols: m.exports.length,
    slug: moduleToSlug(m.name),
  }));

  const nodeNames = new Set(nodes.map((n) => n.name));
  const edges: IndexEdge[] = [];

  for (const m of modules) {
    for (const dep of m.internalDeps) {
      // 匹配到已知模块
      for (const target of modules) {
        if (target.name === m.name) continue;
        if (dep.startsWith(target.name) || target.name.startsWith(dep.split("/").slice(0, 2).join("/"))) {
          const edge = { from: m.name, to: target.name };
          if (!edges.some((e) => e.from === edge.from && e.to === edge.to)) {
            edges.push(edge);
          }
          break;
        }
      }
    }
  }

  return { nodes, edges };
}

// ============================================================
// Markdown 生成
// ============================================================

function buildIndexMarkdown(
  root: string,
  result: ScanResult,
  graph: IndexGraph,
  categories: Map<string, IndexNode[]>,
): string {
  const md: string[] = [
    `# Architecture Overview`,
    "",
    `> Codebase: \`${root}\``,
    `> Total: ${result.stats.totalFiles} files · ${result.stats.totalLines} lines · ${result.stats.totalModules} modules · ${result.stats.totalSymbols} exported symbols`,
    "",
    "---",
    "",
    "## Module Map",
    "",
    "```mermaid",
    "graph TD",
  ];

  // Mermaid 节点
  for (const node of graph.nodes.slice(0, 30)) {
    const safeName = node.name.replace(/[^a-zA-Z0-9]/g, "_");
    md.push(`  ${safeName}["${node.name}<br/>(${node.symbols} symbols)"]`);
  }

  // Mermaid 边
  for (const edge of graph.edges.slice(0, 50)) {
    const from = edge.from.replace(/[^a-zA-Z0-9]/g, "_");
    const to = edge.to.replace(/[^a-zA-Z0-9]/g, "_");
    md.push(`  ${from} --> ${to}`);
  }

  md.push("```", "");

  // 按分类列出模块
  const catOrder = [
    "Entry Point", "Core Logic", "Adapters", "Storage", "Data Records",
    "Scene Management", "Persona / Profile", "Prompts", "Offload Pipeline",
    "Hooks / Events", "Gateway / API", "MCP Tools", "Seed Data",
    "CLI", "Reporting", "Utilities", "Plugin", "Other",
  ];

  for (const cat of catOrder) {
    const nodes = categories.get(cat);
    if (!nodes || nodes.length === 0) continue;

    md.push(`## ${cat}`, "");

    for (const node of nodes) {
      const pageRef = `[[${node.slug}]]`;
      md.push(`- ${pageRef} — ${node.files} files, ${node.symbols} symbols`);
    }
    md.push("");
  }

  // 关键依赖
  md.push("## Key Dependencies", "");

  const hubNodes = graph.nodes
    .filter((n) => graph.edges.filter((e) => e.to === n.name).length >= 3)
    .sort((a, b) => graph.edges.filter((e) => e.to === b.name).length - graph.edges.filter((e) => e.to === a.name).length);

  if (hubNodes.length > 0) {
    md.push("### Most Depended-On Modules (Hub Nodes)", "");
    for (const node of hubNodes.slice(0, 10)) {
      const count = graph.edges.filter((e) => e.to === node.name).length;
      md.push(`- \`${node.name}\` — depended on by **${count}** other modules`);
    }
    md.push("");
  }

  // Extraction Stats
  md.push("## Extraction Stats", "");
  md.push("| Module | Files | Symbols | Suggested Pages | Category |");
  md.push("|--------|-------|---------|-----------------|----------|");

  for (const m of result.modules) {
    const cat = categorize(m.name);
    const slug = moduleToSlug(m.name);
    md.push(`| [[${slug}]] | ${m.files.length} | ${m.exports.length} | ${m.suggestedPages} | ${cat} |`);
  }
  md.push("");

  return md.join("\n");
}

// ============================================================
// 主入口
// ============================================================

export async function buildCodebaseIndex(result: ScanResult): Promise<IndexResult> {
  const graph = buildGraph(result.modules);

  // 按分类分组
  const categories = new Map<string, IndexNode[]>();
  for (const node of graph.nodes) {
    const list = categories.get(node.category) || [];
    list.push(node);
    categories.set(node.category, list);
  }

  const indexMarkdown = buildIndexMarkdown(result.root, result, graph, categories);

  return {
    root: result.root,
    graph,
    categories,
    indexMarkdown,
  };
}
