/**
 * Log (log.md) entry management
 */

import fs from "node:fs/promises";
import type { WikiLog, LogEntry } from "@llmwiki/shared";

/** Parse log.md into structured log entries */
export async function parseLog(logPath: string): Promise<WikiLog> {
  const log: WikiLog = { entries: [] };
  try {
    const content = await fs.readFile(logPath, "utf-8");
    const lines = content.split("\n");
    let current: Partial<LogEntry> | null = null;

    for (const line of lines) {
      const entryMatch = line.match(
        /^## (\S+) \| (\S+) \| (\S+) \| (.+)/
      );
      if (entryMatch) {
        if (current?.timestamp) {
          log.entries.push(current as LogEntry);
        }
        current = {
          timestamp: entryMatch[1],
          level: entryMatch[2] as LogEntry["level"],
          action: entryMatch[3],
          message: entryMatch[4],
        };
      } else if (current && line.trim() && !line.startsWith("#")) {
        // Additional details line
        try {
          current.details = JSON.parse(line.trim());
        } catch {
          // Not JSON, skip
        }
      }
    }
    if (current?.timestamp) {
      log.entries.push(current as LogEntry);
    }
  } catch {
    // log.md may not exist
  }
  return log;
}

/** Append a log entry to log.md */
export async function appendLogEntry(
  logPath: string,
  entry: LogEntry
): Promise<void> {
  const line = `## ${entry.timestamp} | ${entry.level} | ${entry.action} | ${entry.message}`;
  const details = entry.details
    ? `\n${JSON.stringify(entry.details)}`
    : "";
  const block = `${line}${details}\n\n`;

  // Ensure file exists
  try {
    await fs.access(logPath);
  } catch {
    await fs.writeFile(logPath, "# LLM Wiki — Operation Log\n\n", "utf-8");
  }

  await fs.appendFile(logPath, block, "utf-8");
}
