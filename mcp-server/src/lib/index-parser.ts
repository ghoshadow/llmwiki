/**
 * Index (index.md) parser and rebuilder
 */

import fs from "node:fs/promises";
import type { WikiIndex, IndexEntry, IndexCategory } from "@llmwiki/shared";

/** Parse index.md into a structured WikiIndex */
export async function parseIndex(indexPath: string): Promise<WikiIndex> {
  const index: WikiIndex = { categories: [], lastUpdated: "" };
  try {
    const content = await fs.readFile(indexPath, "utf-8");
    const lines = content.split("\n");
    let currentCategory: IndexCategory | null = null;

    for (const line of lines) {
      const h2Match = line.match(/^## (.+)/);
      if (h2Match) {
        if (currentCategory) {
          index.categories.push(currentCategory);
        }
        currentCategory = { name: h2Match[1].trim(), entries: [] };
        continue;
      }

      const linkMatch = line.match(/^- \[\[([^\]|]+)(?:\|([^\]]+))?\]\]\s*(?:[-–—]\s*(.*))?/);
      if (linkMatch && currentCategory) {
        currentCategory.entries.push({
          title: linkMatch[2] || linkMatch[1],
          slug: linkMatch[1].trim(),
          category: currentCategory.name,
          summary: linkMatch[3]?.trim() || "",
          tags: [],
          status: "published",
        });
      }
    }
    if (currentCategory) {
      index.categories.push(currentCategory);
    }
  } catch {
    // index.md may not exist yet
  }
  return index;
}

/** Rebuild index.md from entries */
export async function rebuildIndex(
  indexPath: string,
  categories: IndexCategory[]
): Promise<void> {
  const lines: string[] = [
    "# LLM Wiki — Knowledge Index",
    "",
  ];

  for (const cat of categories) {
    lines.push(`## ${cat.name}`);
    lines.push("");
    for (const entry of cat.entries) {
      const label = entry.title !== entry.slug
        ? `[[${entry.slug}|${entry.title}]]`
        : `[[${entry.slug}]]`;
      const suffix = entry.summary ? ` — ${entry.summary}` : "";
      lines.push(`- ${label}${suffix}`);
    }
    lines.push("");
  }

  await fs.writeFile(indexPath, lines.join("\n"), "utf-8");
}
