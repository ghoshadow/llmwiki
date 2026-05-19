---
title: src/cli
slug: src-cli
created: '2026-05-19T03:56:45.976Z'
updated: '2026-05-19T03:56:45.976Z'
tags:
  - cli
  - memory
status: published
category: codebase
---
# Module: src/cli

| Property | Value |
|----------|-------|
| Path | `src/cli` |
| Files | 2 |
| Exported Symbols | 3 |
| Language | typescript |

## Files

- `commands/seed.ts`
- `index.ts`

## External Dependencies

- `commander`
- `node:fs`
- `node:path`
- `node:readline`

## Exported API

### Interfaces

#### `SeedCliContext` `[exported]`

> avoiding a hard dependency on the full plugin CLI context type.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface SeedCliContext {
  /** OpenClaw config (for LLM calls in L1 extraction). */
  config: unknown;
  /** Raw plugin config (same shape as api.pluginConfig). */
  pluginConfig: unknown;
  /** State directory root (e.g. ~/.openclaw). */
  stateDir: string;
  /** Logger instance. */
  logger: {
    debug?: (message: string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
  };
}

// ============================
// 
```
</details>

### Functions

#### `registerSeedCommand` `[exported]`

> Register the `seed` subcommand under the memory-tdai CLI namespace.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function registerSeedCommand(parent: Command, ctx: SeedCliContext): void {
  parent
    .command("seed")
    .description("Seed historical conversation data into the memory pipeline (L0 → L1)")
    .requiredOption("--input <file>", "Path to input JSON file")
    .option("--output-dir <dir>", "Output directory for pipeline data (default: auto-generated)")
    .option("--session-key <key>", "Fallback session key when input lacks one")
    .option("--config <file>", "Path to memory-tdai conf
```
</details>

#### `registerMemoryTdaiCli` `[exported]`

> command registrars.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function registerMemoryTdaiCli(program: Command, ctx: SeedCliContext): void {
  // Register subcommands
  registerSeedCommand(program, ctx);

  // Future: registerQueryCommand(program, ctx);
  // Future: registerStatsCommand(program, ctx);
}
```
</details>

## Key Relationships

- (this file) → `node:fs#fs` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `node:readline#readline` _(import)_
- (this file) → `commander#type { Command` _(import)_
- (this file) → `../index.ts#type { SeedCliContext` _(import)_
- (this file) → `../../core/seed/types.js#type { SeedCommandOptions` _(import)_
- (this file) → `../../core/seed/input.js#loadAndValidateInput` _(import)_
- (this file) → `../../core/seed/input.js#fillTimestamps` _(import)_
- (this file) → `../../core/seed/input.js#SeedValidationError` _(import)_
- (this file) → `../../core/seed/seed-runtime.js#executeSeed` _(import)_
- (this file) → `commander#type { Command` _(import)_
- (this file) → `./commands/seed.js#registerSeedCommand` _(import)_

## Suggested Tags

`#cli` `#memory`
