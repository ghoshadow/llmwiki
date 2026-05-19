---
title: src/utils
slug: src-utils
created: '2026-05-19T03:56:46.153Z'
updated: '2026-05-19T03:56:46.153Z'
tags:
  - utils
  - config
  - hooks
  - storage
status: published
category: codebase
---
# Module: src/utils

| Property | Value |
|----------|-------|
| Path | `src/utils` |
| Files | 14 |
| Exported Symbols | 80 |
| Language | typescript |

## Files

- `backup.ts`
- `checkpoint.ts`
- `clean-context-runner.ts`
- `ensure-hook-policy.ts`
- `env.ts`
- `managed-timer.ts`
- `manifest.ts`
- `memory-cleaner.ts`
- `pipeline-factory.ts`
- `pipeline-manager.ts`
- `sanitize.ts`
- `serial-queue.ts`
- `session-filter.ts`
- `text-utils.ts`

## External Dependencies

- `json5`
- `node:crypto`
- `node:fs`
- `node:os`
- `node:path`
- `node:url`
- `openclaw`

## Exported API

### Classs

#### `BackupManager` `[exported]`

```typescript
export class BackupManager {
```

<details>
<summary>Show code</summary>

```typescript
export class BackupManager {
  private backupRoot: string;

  /**
   * @param backupRoot - Absolute path to the root backup directory
   *                     (e.g. `<dataDir>/.backup`).
   */
  constructor(backupRoot: string) {
    this.backupRoot = backupRoot;
  }

  /**
   * Backup a single file.
   *
   * Destination: `<backupRoot>/<category>/<category>_<timestamp>_<tag>.<ext>`
   *
   * @param srcFile   - Absolute path to the source file
   * @param category  - Logical grouping (e.g. "perso
```
</details>

#### `CheckpointManager` `[exported]`

```typescript
export class CheckpointManager {
```

<details>
<summary>Show code</summary>

```typescript
export class CheckpointManager {
  private filePath: string;
  private logger: CheckpointLogger;

  constructor(dataDir: string, logger?: CheckpointLogger) {
    this.filePath = path.join(dataDir, ".metadata", "recall_checkpoint.json");
    this.logger = logger ?? noopLogger;
  }

  // ============================
  // Low-level I/O (internal)
  // ============================

  private async readRaw(): Promise<Checkpoint> {
    try {
      const raw = await fs.readFile(this.filePath, "utf-8");
```
</details>

#### `CleanContextRunner` `[exported]`

```typescript
export class CleanContextRunner {
```

<details>
<summary>Show code</summary>

```typescript
export class CleanContextRunner {
  private options: CleanContextRunnerOptions;
  private logger: RunnerLogger | undefined;
  /** Resolved provider after modelRef / config fallback */
  private resolvedProvider: string | undefined;
  /** Resolved model after modelRef / config fallback */
  private resolvedModel: string | undefined;

  constructor(options: CleanContextRunnerOptions) {
    this.options = options;
    this.logger = options.logger;

    // Model resolution priority:
    // 1. modelR
```
</details>

#### `ManagedTimer` `[exported]`

> The optional `isDestroyed` guard prevents firing after the owner is torn down.

```typescript
export class ManagedTimer {
```

<details>
<summary>Show code</summary>

```typescript
export class ManagedTimer {
  private handle: TimerHandle | null = null;
  private callback: (() => void) | null = null;
  /** Absolute epoch-ms when the current timer is scheduled to fire. */
  private scheduledAt = 0;

  constructor(
    /** Human-readable name for logging. */
    public readonly name: string,
    /** If provided, checked before firing — skips callback when true. */
    private readonly isDestroyed?: () => boolean,
  ) {}

  // ── Core operations ──────────────────────────────
```
</details>

#### `LocalMemoryCleaner` `[exported]`

```typescript
export class LocalMemoryCleaner {
```

<details>
<summary>Show code</summary>

```typescript
export class LocalMemoryCleaner {
  private readonly timer: ManagedTimer;
  private destroyed = false;
  private vectorStore?: IMemoryStore;

  constructor(private readonly opts: MemoryCleanerOptions) {
    this.timer = new ManagedTimer("memory-tdai-cleaner", () => this.destroyed);
    this.vectorStore = opts.vectorStore;
  }

  setVectorStore(vectorStore: IMemoryStore | undefined): void {
    this.vectorStore = vectorStore;
  }

  start(): void {
    if (this.destroyed) return;

    const now =
```
</details>

#### `MemoryPipelineManager` `[exported]`

> Consecutive L1 failure count for retry limiting. Reset on success or new conversation.

```typescript
export class MemoryPipelineManager {
```

<details>
<summary>Show code</summary>

```typescript
export class MemoryPipelineManager {
  // Config (converted to ms internally)
  private readonly l1IdleTimeoutMs: number;
  private readonly everyNConversations: number;
  private readonly enableWarmup: boolean;
  private readonly l2DelayAfterL1Ms: number;
  private readonly l2MinIntervalMs: number;
  private readonly l2MaxIntervalMs: number;
  private readonly sessionActiveWindowMs: number;

  /** Delay before retrying a failed L1 (ms). */
  private readonly L1_RETRY_DELAY_MS = 30_000; // 30 se
```
</details>

#### `SerialQueue` `[exported]`

```typescript
export class SerialQueue {
```

<details>
<summary>Show code</summary>

```typescript
export class SerialQueue {
  /** Human-readable name for logging / diagnostics. */
  public readonly name: string;

  private queue: QueueEntry[] = [];
  private running = false;
  private paused = false;
  private idleResolvers: Array<() => void> = [];

  /** Optional debug logger — receives diagnostic messages for enqueue/dequeue/complete. */
  private debugFn?: (msg: string) => void;

  constructor(name = "unnamed") {
    this.name = name;
  }

  /** Set a debug logger for queue diagnostics. 
```
</details>

#### `SessionFilter` `[exported]`

> `shouldSkip(sessionKey)` or `shouldSkipCtx(ctx)` at each gate.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export class SessionFilter {
  private readonly matchers: SessionKeyMatcher[];

  constructor(excludeAgents: string[] = []) {
    // Merge built-in rules + user-configured exclude patterns into one flat list
    const userMatchers = excludeAgents
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .map(globToMatcher);

    this.matchers = [...BUILTIN_MATCHERS, ...userMatchers];
  }

  /** Should this sessionKey be skipped? */
  shouldSkip(sessionKey: string): boolean {
    retur
```
</details>

### Interfaces

#### `RunnerSessionState` `[exported]`

> and are NEVER touched by the PipelineManager's persistStates().

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface RunnerSessionState {
  // ═══ L0 — per-session capture cursor ═══
  /** Epoch ms of the newest message captured for THIS session.
   *  Used instead of the global `Checkpoint.last_captured_timestamp` so that
   *  concurrent sessions don't advance each other's cursors and cause missed messages. */
  last_captured_timestamp: number;

  // ═══ L1 — cursor & continuity ═══
  /** L0 JSONL cursor: epoch ms of last message processed by L1 */
  last_l1_cursor: number;
  /** Last scene 
```
</details>

#### `PipelineSessionState` `[exported]`

> and are NEVER touched by CheckpointManager's L0/L1 methods.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface PipelineSessionState {
  /** Conversation rounds since last L1 trigger */
  conversation_count: number;
  /** ISO timestamp of the last extraction completion */
  last_extraction_time: string;
  /** ISO timestamp cursor for incremental extraction reads */
  last_extraction_updated_time: string;
  /** Epoch ms of the last notifyConversation call */
  last_active_time: number;
  /** Mirrors conversation_count at L1 completion time (for L2 tracking) */
  l2_pending_l1_count: number
```
</details>

#### `Checkpoint` `[exported]`

> ISO timestamp of last L2 extraction completion

```typescript
export interface Checkpoint {
```

<details>
<summary>Show code</summary>

```typescript
export interface Checkpoint {
  // ═══ Global counters ═══
  /** Epoch ms of the newest message successfully uploaded. Messages with ts > this are new. */
  last_captured_timestamp: number;
  /** Total messages processed across all time */
  total_processed: number;
  last_persona_at: number;
  last_persona_time: string;
  request_persona_update: boolean;
  persona_update_reason: string;
  memories_since_last_persona: number;
  scenes_processed: number;

  // ═══ Per-session split state ═══
  /*
```
</details>

#### `CheckpointLogger` `[exported]`

```typescript
export interface CheckpointLogger {
```

<details>
<summary>Show code</summary>

```typescript
export interface CheckpointLogger {
  info(msg: string): void;
  warn?(msg: string): void;
}

const noopLogger: CheckpointLogger = { info() {} };

// ============================
// Per-file async lock
// ============================
// Keyed by resolved file path. Multiple CheckpointManager instances pointing
// to the same file automatically share the same lock — callers don't need to
// coordinate instance creation.

const fileLocks = new Map<string, Promise<void>>();

/**
 * Serialize async 
```
</details>

#### `RunnerLogger` 

```typescript
interface RunnerLogger {
```

<details>
<summary>Show code</summary>

```typescript
interface RunnerLogger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

// Dynamic import type — runEmbeddedPiAgent is an internal API
// Prefer the public plugin runtime signature so host-injected runtimes stay assignable.
type RunEmbeddedPiAgentFn = OpenClawPluginApi["runtime"]["agent"]["runEmbeddedPiAgent"];

export interface EmbeddedAgentRuntimeLike {
  runEmbeddedPiAgent?: RunEmbeddedPiAgentFn
```
</details>

#### `EmbeddedAgentRuntimeLike` `[exported]`

```typescript
export interface EmbeddedAgentRuntimeLike {
```

<details>
<summary>Show code</summary>

```typescript
export interface EmbeddedAgentRuntimeLike {
  runEmbeddedPiAgent?: RunEmbeddedPiAgentFn;
}

let _preferredAgentRuntime: EmbeddedAgentRuntimeLike | undefined;

export function setPreferredEmbeddedAgentRuntime(
  agentRuntime: EmbeddedAgentRuntimeLike | undefined,
): void {
  _preferredAgentRuntime = agentRuntime;
}

function resolveInjectedRunEmbeddedPiAgent(
  agentRuntime?: EmbeddedAgentRuntimeLike,
): RunEmbeddedPiAgentFn | undefined {
  const candidate =
    agentRuntime?.runEmbeddedPiAgent ?
```
</details>

#### `ModelRef` `[exported]`

> Parsed model reference: { provider, model }

```typescript
/** Parsed model reference: { provider, model } */
```

<details>
<summary>Show code</summary>

```typescript
export interface ModelRef {
  provider: string;
  model: string;
}

/**
 * Parse a "provider/model" string into its components.
 * Returns undefined if the input is empty or doesn't contain a "/".
 *
 * Examples:
 *   "azure/gpt-5.2-chat"          → { provider: "azure", model: "gpt-5.2-chat" }
 *   "custom-host/org/model-v2"    → { provider: "custom-host", model: "org/model-v2" }
 *   ""                            → undefined
 *   "bare-model-name"             → undefined (no "/" — may be an ali
```
</details>

#### `CleanContextRunnerOptions` `[exported]`

```typescript
export interface CleanContextRunnerOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface CleanContextRunnerOptions {
  config: unknown; // OpenClawConfig
  provider?: string;
  model?: string;
  /**
   * Convenience field: full "provider/model" string.
   * Takes precedence over separate `provider`/`model` fields.
   * When all three (modelRef, provider, model) are omitted,
   * automatically falls back to the main config's `agents.defaults.model`.
   */
  modelRef?: string;
  /** Preferred runtime seam. When absent, falls back to the legacy dist bridge. */
  agentR
```
</details>

#### `HookPolicyDecision` `[exported]`

> having to re-implement the parse step themselves.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface HookPolicyDecision {
  /** Whether the auto-patch should be applied. */
  apply: boolean;
  /** The raw value passed in (useful for logging verbatim). */
  rawVersion: unknown;
  /** Parsed `[x, y, z]`, or `null` if the input was unparsable. */
  parsedXYZ: [number, number, number] | null;
  /** The minimum version threshold the decision was made against. */
  minXYZ: readonly [number, number, number];
}

/**
 * Decide whether we should apply the `allowConversationAccess` auto-p
```
</details>

#### `Logger` 

```typescript
interface Logger {
```

<details>
<summary>Show code</summary>

```typescript
interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  debug?: (msg: string) => void;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function isGatewayStart(): boolean {
  const args = process.argv.map((v) => String(v || "").toLowerCase());
  const idx = args.findIndex((a) =>
    a.endsWith("openclaw") || a.endsWith("openclaw.mjs") || a.endsWith("entry.js"),
  );
  if (idx < 0) return 
```
</details>

#### `ManifestStoreInfo` `[exported]`

```typescript
export interface ManifestStoreInfo {
```

<details>
<summary>Show code</summary>

```typescript
export interface ManifestStoreInfo {
  type: "sqlite" | "tcvdb";
  sqlite?: {
    /** Relative path to the SQLite DB file (relative to dataDir). */
    path: string;
  };
  tcvdb?: {
    url: string;
    database: string;
    /** User-friendly alias (optional). */
    alias?: string;
  };
}

export interface ManifestSeedInfo {
  /** Original input file name (basename only). */
  inputFile?: string;
  sessions: number;
  rounds: number;
  messages: number;
  startedAt: string;
  completedAt: stri
```
</details>

#### `ManifestSeedInfo` `[exported]`

> User-friendly alias (optional).

```typescript
export interface ManifestSeedInfo {
```

<details>
<summary>Show code</summary>

```typescript
export interface ManifestSeedInfo {
  /** Original input file name (basename only). */
  inputFile?: string;
  sessions: number;
  rounds: number;
  messages: number;
  startedAt: string;
  completedAt: string;
}

export interface Manifest {
  /** Schema version for future migrations. */
  version: 1;
  /** Timestamp when the manifest was first created. */
  createdAt: string;
  /** Store binding — written once on first init. */
  store: ManifestStoreInfo;
  /** Seed run info — null for live-run
```
</details>

#### `Manifest` `[exported]`

```typescript
export interface Manifest {
```

<details>
<summary>Show code</summary>

```typescript
export interface Manifest {
  /** Schema version for future migrations. */
  version: 1;
  /** Timestamp when the manifest was first created. */
  createdAt: string;
  /** Store binding — written once on first init. */
  store: ManifestStoreInfo;
  /** Seed run info — null for live-runtime directories. */
  seed: ManifestSeedInfo | null;
}

// ============================
// Paths
// ============================

const METADATA_DIR = ".metadata";
const MANIFEST_FILE = "manifest.json";

export fu
```
</details>

#### `StoreConfigSnapshot` `[exported]`

```typescript
export interface StoreConfigSnapshot {
```

<details>
<summary>Show code</summary>

```typescript
export interface StoreConfigSnapshot {
  type: "sqlite" | "tcvdb";
  sqlitePath?: string;
  tcvdbUrl?: string;
  tcvdbDatabase?: string;
  tcvdbAlias?: string;
}

/**
 * Build a ManifestStoreInfo from the current store config snapshot.
 */
export function buildStoreInfo(snapshot: StoreConfigSnapshot): ManifestStoreInfo {
  const info: ManifestStoreInfo = { type: snapshot.type };
  if (snapshot.type === "sqlite") {
    info.sqlite = { path: snapshot.sqlitePath ?? "vectors.db" };
  } else {
    in
```
</details>

#### `Logger` 

```typescript
interface Logger {
```

<details>
<summary>Show code</summary>

```typescript
interface Logger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface MemoryCleanerOptions {
  baseDir: string;
  retentionDays: number;
  cleanTime: string;
  logger?: Logger;
  vectorStore?: IMemoryStore;
}

interface CleanupStats {
  scannedFiles: number;
  changedFiles: number;
  skippedNonShardFiles: number;
  deleteFailedFiles: number;
}

const TAG = "[memory-tdai][cleaner]";
con
```
</details>

#### `MemoryCleanerOptions` `[exported]`

```typescript
export interface MemoryCleanerOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface MemoryCleanerOptions {
  baseDir: string;
  retentionDays: number;
  cleanTime: string;
  logger?: Logger;
  vectorStore?: IMemoryStore;
}

interface CleanupStats {
  scannedFiles: number;
  changedFiles: number;
  skippedNonShardFiles: number;
  deleteFailedFiles: number;
}

const TAG = "[memory-tdai][cleaner]";
const L0_DIR_NAME = "conversations";
const L1_DIR_NAME = "records";

export class LocalMemoryCleaner {
  private readonly timer: ManagedTimer;
  private destroyed = fal
```
</details>

#### `CleanupStats` 

```typescript
interface CleanupStats {
```

<details>
<summary>Show code</summary>

```typescript
interface CleanupStats {
  scannedFiles: number;
  changedFiles: number;
  skippedNonShardFiles: number;
  deleteFailedFiles: number;
}

const TAG = "[memory-tdai][cleaner]";
const L0_DIR_NAME = "conversations";
const L1_DIR_NAME = "records";

export class LocalMemoryCleaner {
  private readonly timer: ManagedTimer;
  private destroyed = false;
  private vectorStore?: IMemoryStore;

  constructor(private readonly opts: MemoryCleanerOptions) {
    this.timer = new ManagedTimer("memory-tdai-cleane
```
</details>

#### `PipelineLogger` `[exported]`

```typescript
export interface PipelineLogger {
```

<details>
<summary>Show code</summary>

```typescript
export interface PipelineLogger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

// ============================
// Factory options
// ============================

export interface PipelineFactoryOptions {
  /** Plugin data directory (L0, records, scene_blocks, vectors.db, etc.). */
  pluginDataDir: string;
  /** Parsed memory-tdai config. */
  cfg: MemoryTdaiConfig;
  /** OpenClaw config object (
```
</details>

#### `PipelineFactoryOptions` `[exported]`

```typescript
export interface PipelineFactoryOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface PipelineFactoryOptions {
  /** Plugin data directory (L0, records, scene_blocks, vectors.db, etc.). */
  pluginDataDir: string;
  /** Parsed memory-tdai config. */
  cfg: MemoryTdaiConfig;
  /** OpenClaw config object (needed for LLM calls in L1). */
  openclawConfig: unknown;
  /** Logger instance. */
  logger: PipelineLogger;
  /** Session filter (optional, defaults to empty). */
  sessionFilter?: SessionFilter;
  /** Host-neutral LLM runner for L1 extraction (text-only, enabl
```
</details>

#### `PipelineInstance` `[exported]`

```typescript
export interface PipelineInstance {
```

<details>
<summary>Show code</summary>

```typescript
export interface PipelineInstance {
  /** The pipeline scheduler. */
  scheduler: MemoryPipelineManager;
  /** VectorStore (undefined if init failed or degraded). */
  vectorStore: IMemoryStore | undefined;
  /** EmbeddingService (undefined if not configured or init failed). */
  embeddingService: EmbeddingService | undefined;
  /**
   * Destroy all resources (scheduler, VectorStore, EmbeddingService).
   * Call this on shutdown / cleanup.
   */
  destroy: () => Promise<void>;
}

// ============
```
</details>

### Types

#### `RunEmbeddedPiAgentFn` 

```typescript
type RunEmbeddedPiAgentFn = OpenClawPluginApi["runtime"]["agent"]["runEmbeddedPiAgent"];
```

<details>
<summary>Show code</summary>

```typescript
type RunEmbeddedPiAgentFn = OpenClawPluginApi["runtime"]["agent"]["runEmbeddedPiAgent"];

export interface EmbeddedAgentRuntimeLike {
  runEmbeddedPiAgent?: RunEmbeddedPiAgentFn;
}

let _preferredAgentRuntime: EmbeddedAgentRuntimeLike | undefined;

export function setPreferredEmbeddedAgentRuntime(
  agentRuntime: EmbeddedAgentRuntimeLike | undefined,
): void {
  _preferredAgentRuntime = agentRuntime;
}

function resolveInjectedRunEmbeddedPiAgent(
  agentRuntime?: EmbeddedAgentRuntimeLike,
): Run
```
</details>

#### `TimerHandle` 

> The optional `isDestroyed` guard prevents firing after the owner is torn down.

```typescript
* - `schedule(delayMs, cb)` — cancel any pending timer, set a new one
```

<details>
<summary>Show code</summary>

```typescript
type TimerHandle = ReturnType<typeof setTimeout>;

export class ManagedTimer {
  private handle: TimerHandle | null = null;
  private callback: (() => void) | null = null;
  /** Absolute epoch-ms when the current timer is scheduled to fire. */
  private scheduledAt = 0;

  constructor(
    /** Human-readable name for logging. */
    public readonly name: string,
    /** If provided, checked before firing — skips callback when true. */
    private readonly isDestroyed?: () => boolean,
  ) {}

  /
```
</details>

#### `L1Runner` `[exported]`

> L1 runner — batch-processes buffered messages for a session.

```typescript
/** L1 runner — batch-processes buffered messages for a session. */
```

<details>
<summary>Show code</summary>

```typescript
export type L1Runner = (params: {
  sessionKey: string;
  msg: CapturedMessage[];
  bg_msg: CapturedMessage[];
}) => Promise<L1RunnerResult | void>;

/** Result returned by the L2 extraction runner. */
export interface L2RunnerResult {
  /** The latest `updated_at` cursor from the processed batch. */
  latestCursor?: string;
}

/** L2 extraction runner — processes a single session's records. */
export type L2Runner = (sessionKey: string, cursor?: string) => Promise<L2RunnerResult | void>;

/** L
```
</details>

#### `L2Runner` `[exported]`

> L2 extraction runner — processes a single session's records.

```typescript
/** L2 extraction runner — processes a single session's records. */
```

<details>
<summary>Show code</summary>

```typescript
export type L2Runner = (sessionKey: string, cursor?: string) => Promise<L2RunnerResult | void>;

/** L3 runner — generates persona from all sessions' scene data. */
export type L3Runner = () => Promise<void>;

/** Callback to persist session states to checkpoint. */
export type PipelineStatePersister = (states: Record<string, PipelineSessionState>) => Promise<void>;

const TAG = "[memory-tdai] [pipeline]";

// ============================
// Per-session timer state (in memory only)
// ==========
```
</details>

#### `L3Runner` `[exported]`

> L3 runner — generates persona from all sessions' scene data.

```typescript
/** L3 runner — generates persona from all sessions' scene data. */
```

<details>
<summary>Show code</summary>

```typescript
export type L3Runner = () => Promise<void>;

/** Callback to persist session states to checkpoint. */
export type PipelineStatePersister = (states: Record<string, PipelineSessionState>) => Promise<void>;

const TAG = "[memory-tdai] [pipeline]";

// ============================
// Per-session timer state (in memory only)
// ============================

interface SessionTimerState {
  /** L1 idle timer (resettable): debounces conversation activity. */
  l1Idle: ManagedTimer;
  /** L2 schedule tim
```
</details>

#### `PipelineStatePersister` `[exported]`

> Callback to persist session states to checkpoint.

```typescript
/** Callback to persist session states to checkpoint. */
```

<details>
<summary>Show code</summary>

```typescript
export type PipelineStatePersister = (states: Record<string, PipelineSessionState>) => Promise<void>;

const TAG = "[memory-tdai] [pipeline]";

// ============================
// Per-session timer state (in memory only)
// ============================

interface SessionTimerState {
  /** L1 idle timer (resettable): debounces conversation activity. */
  l1Idle: ManagedTimer;
  /** L2 schedule timer (downward-only): next L2 fire time, only moves earlier. */
  l2Schedule: ManagedTimer;
  /** Whethe
```
</details>

#### `Task` 

> - Optional debug logger for enqueue/dequeue/complete diagnostics

```typescript
* Equivalent to `new PQueue({ concurrency: 1 })` but with zero external
```

<details>
<summary>Show code</summary>

```typescript
type Task<T = unknown> = () => Promise<T>;

interface QueueEntry {
  task: Task;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export class SerialQueue {
  /** Human-readable name for logging / diagnostics. */
  public readonly name: string;

  private queue: QueueEntry[] = [];
  private running = false;
  private paused = false;
  private idleResolvers: Array<() => void> = [];

  /** Optional debug logger — receives diagnostic messages for enqueue/dequeue/complete
```
</details>

#### `SessionKeyMatcher` 

```typescript
type SessionKeyMatcher = (sessionKey: string) => boolean;
```

<details>
<summary>Show code</summary>

```typescript
type SessionKeyMatcher = (sessionKey: string) => boolean;

// ============================
// Non-interactive trigger detection
// ============================

const SKIP_TRIGGERS = new Set(["cron", "heartbeat", "automation", "schedule"]);

/**
 * Returns true when the hook was fired by a non-interactive trigger
 * (heartbeat, cron job, automation, etc.) — these produce no meaningful
 * user conversation and should not be captured or counted.
 */
export function isNonInteractiveTrigger(trigger?
```
</details>

### Functions

#### `setPreferredEmbeddedAgentRuntime` `[exported]`

```typescript
export function setPreferredEmbeddedAgentRuntime(
```

<details>
<summary>Show code</summary>

```typescript
export function setPreferredEmbeddedAgentRuntime(
  agentRuntime: EmbeddedAgentRuntimeLike | undefined,
): void {
  _preferredAgentRuntime = agentRuntime;
}

function resolveInjectedRunEmbeddedPiAgent(
  agentRuntime?: EmbeddedAgentRuntimeLike,
): RunEmbeddedPiAgentFn | undefined {
  const candidate =
    agentRuntime?.runEmbeddedPiAgent ?? _preferredAgentRuntime?.runEmbeddedPiAgent;
  return typeof candidate === "function" ? candidate : undefined;
}

async function resolveRunEmbeddedPiAgent(
  
```
</details>

#### `prewarmEmbeddedAgent` `[exported]`

> Returns immediately (fire-and-forget) — errors are swallowed.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function prewarmEmbeddedAgent(
  logger?: RunnerLogger,
  agentRuntime?: EmbeddedAgentRuntimeLike,
): void {
  if (resolveInjectedRunEmbeddedPiAgent(agentRuntime)) {
    logger?.debug?.(
      `${TAG} prewarmEmbeddedAgent: runtime capability already available, skipping legacy preload`,
    );
    return;
  }

  loadRunEmbeddedPiAgent(logger).catch((err) => {
    logger?.warn(`${TAG} prewarmEmbeddedAgent: failed (non-fatal): ${err instanceof Error ? err.message : String(err)}`);
  });
}

f
```
</details>

#### `parseModelRef` `[exported]`

> "bare-model-name"             → undefined (no "/" — may be an alias)

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function parseModelRef(raw: string | undefined): ModelRef | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const slashIdx = trimmed.indexOf("/");
  if (slashIdx <= 0 || slashIdx === trimmed.length - 1) return undefined;

  return {
    provider: trimmed.slice(0, slashIdx),
    model: trimmed.slice(slashIdx + 1),
  };
}

/**
 * Resolve the user's default model from the main OpenClaw config.
 *
 * Resolution order:
 * 1. Read `ag
```
</details>

#### `resolveModelFromMainConfig` `[exported]`

> 4. Return undefined if nothing resolves — let the core use its built-in default

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function resolveModelFromMainConfig(config: unknown): ModelRef | undefined {
  if (!config || typeof config !== "object") return undefined;

  const cfg = config as Record<string, unknown>;
  const agents = cfg.agents as Record<string, unknown> | undefined;
  if (!agents || typeof agents !== "object") return undefined;

  const defaults = agents.defaults as Record<string, unknown> | undefined;
  if (!defaults || typeof defaults !== "object") return undefined;

  // Step 1: extract raw mod
```
</details>

#### `parseVersionXYZ` `[exported]`

> - "v2026.4.24"       (no leading non-digit allowed — keep strict)

```typescript
*   "2026.4.24-beta.1"   -> [2026, 4, 24]
```

<details>
<summary>Show code</summary>

```typescript
export function parseVersionXYZ(v: unknown): [number, number, number] | null {
  if (typeof v !== "string") {
    return null;
  }
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:[-.].*)?$/);
  if (!m) {
    return null;
  }
  const [, a, b, c] = m;
  return [Number(a), Number(b), Number(c)];
}

/**
 * Compare two `[x, y, z]` tuples. Returns negative / 0 / positive like a
 * standard comparator (a - b).
 */
export function compareVersionXYZ(
  a: readonly [number, number, number],
  b: readonly [num
```
</details>

#### `compareVersionXYZ` `[exported]`

> standard comparator (a - b).

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function compareVersionXYZ(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/**
 * Structured outcome of the hook-policy version gate.
 *
 * Exposed so callers (e.g. index.ts) can log exactly what was compared
 * (`original` raw input, parsed `x.y.z`, and the `min` threshold) without
 * having to re-implement the parse step themselves.
 */
export interface HookPolicyDecision {
  /** Whether 
```
</details>

#### `decideHookPolicy` `[exported]`

> negligible.

```typescript
*   - If the prefix cannot be parsed (unknown / empty / non-string /
```

<details>
<summary>Show code</summary>

```typescript
export function decideHookPolicy(rawVersion: unknown): HookPolicyDecision {
  const parsedXYZ = parseVersionXYZ(rawVersion);
  const apply =
    parsedXYZ !== null &&
    compareVersionXYZ(parsedXYZ, HOOK_POLICY_MIN_VERSION) >= 0;
  return {
    apply,
    rawVersion,
    parsedXYZ,
    minXYZ: HOOK_POLICY_MIN_VERSION,
  };
}

/**
 * Thin boolean wrapper around {@link decideHookPolicy} for callers that
 * only need the yes/no answer.
 */
export function shouldApplyHookPolicy(rawVersion: unknown)
```
</details>

#### `shouldApplyHookPolicy` `[exported]`

> only need the yes/no answer.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function shouldApplyHookPolicy(rawVersion: unknown): boolean {
  return decideHookPolicy(rawVersion).apply;
}

interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  debug?: (msg: string) => void;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function isGatewayStart(): boolean {
  const args = process.argv.map((v) => String(v || "").toLowerCase());
  const idx = args.findIndex(
```
</details>

#### `ensurePluginHookPolicy` `[exported]`

> 2. Fallback to manual file write if SDK is unavailable or fails.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function ensurePluginHookPolicy(params: {
  rootConfig?: unknown;
  runtimeConfig?: {
    mutateConfigFile?: (p: any) => Promise<any>;
  };
  logger: Logger;
}): void {
  const { logger } = params;
  const TAG = "[memory-tdai] [hook-policy]";

  if (!isGatewayStart()) return;
  if (hasPolicyAlready(params.rootConfig)) return;

  // Try SDK path first (handles everything + triggers restart)
  if (params.runtimeConfig?.mutateConfigFile) {
    logger.info(`${TAG} Missing allowConversationAcc
```
</details>

#### `getEnv` `[exported]`

> Read an environment variable value (returns undefined if not set).

```typescript
/** Read an environment variable value (returns undefined if not set). */
```

<details>
<summary>Show code</summary>

```typescript
export function getEnv(key: string): string | undefined {
  return _e[key];
}
```
</details>

#### `manifestPath` `[exported]`

```typescript
export function manifestPath(dataDir: string): string {
```

<details>
<summary>Show code</summary>

```typescript
export function manifestPath(dataDir: string): string {
  return path.join(dataDir, METADATA_DIR, MANIFEST_FILE);
}

// ============================
// Read / Write
// ============================

/**
 * Read an existing manifest from disk. Returns `null` if not found or unparseable.
 */
export function readManifest(dataDir: string): Manifest | null {
  const p = manifestPath(dataDir);
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.p
```
</details>

#### `readManifest` `[exported]`

> Read an existing manifest from disk. Returns `null` if not found or unparseable.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function readManifest(dataDir: string): Manifest | null {
  const p = manifestPath(dataDir);
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

/**
 * Write a manifest to disk (creates `.metadata/` if needed).
 */
export function writeManifest(dataDir: string, manifest: Manifest): void {
  const dir = path.join(dataDir, METADATA_DIR);
  fs.mkdirSync(dir, { recursive: true 
```
</details>

#### `writeManifest` `[exported]`

> Write a manifest to disk (creates `.metadata/` if needed).

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function writeManifest(dataDir: string, manifest: Manifest): void {
  const dir = path.join(dataDir, METADATA_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    manifestPath(dataDir),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8",
  );
}

// ============================
// Store binding helpers
// ============================

export interface StoreConfigSnapshot {
  type: "sqlite" | "tcvdb";
  sqlitePath?: string;
  tcvdbUrl?: string;
  tcvdbDatabase?: st
```
</details>

#### `buildStoreInfo` `[exported]`

> Build a ManifestStoreInfo from the current store config snapshot.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function buildStoreInfo(snapshot: StoreConfigSnapshot): ManifestStoreInfo {
  const info: ManifestStoreInfo = { type: snapshot.type };
  if (snapshot.type === "sqlite") {
    info.sqlite = { path: snapshot.sqlitePath ?? "vectors.db" };
  } else {
    info.tcvdb = {
      url: snapshot.tcvdbUrl!,
      database: snapshot.tcvdbDatabase!,
      alias: snapshot.tcvdbAlias || undefined,
    };
  }
  return info;
}

/**
 * Compare the persisted store binding against the current config.
 * Retur
```
</details>

#### `diffStoreBinding` `[exported]`

> Returns a list of human-readable mismatch descriptions (empty = all good).

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function diffStoreBinding(
  persisted: ManifestStoreInfo,
  current: ManifestStoreInfo,
): string[] {
  const diffs: string[] = [];

  if (persisted.type !== current.type) {
    diffs.push(`store type changed: ${persisted.type} → ${current.type}`);
    return diffs; // no point comparing fields across different types
  }

  if (persisted.type === "sqlite" && current.type === "sqlite") {
    if (persisted.sqlite?.path !== current.sqlite?.path) {
      diffs.push(`sqlite path changed: ${pe
```
</details>

#### `initDataDirectories` `[exported]`

> Safe to call multiple times (mkdirSync with `recursive: true`).

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function initDataDirectories(dataDir: string): void {
  const dirs = ["conversations", "records", "scene_blocks", ".metadata", ".backup"];
  for (const sub of dirs) {
    fs.mkdirSync(path.join(dataDir, sub), { recursive: true });
  }
}

// ============================
// Store init (once-async singleton)
// ============================

export interface StoreInitResult {
  vectorStore: IMemoryStore | undefined;
  embeddingService: EmbeddingService | undefined;
  /** Whether a background 
```
</details>

#### `initStores` `[exported]`

> Supports both SQLite (sync init) and TCVDB (async init) backends.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function initStores(
  cfg: MemoryTdaiConfig,
  pluginDataDir: string,
  logger: PipelineLogger,
): Promise<StoreInitResult> {
  const key = pluginDataDir;
  if (!_storeInitCache.has(key)) {
    _storeInitCache.set(key, _doInitStores(cfg, pluginDataDir, logger));
  }
  return _storeInitCache.get(key)!;
}

/**
 * Reset the cached store singleton(s).
 *
 * Call this during `gateway_stop` (after closing the actual store/embedding
 * resources) so that a subsequent `register()` on hot-restart
```
</details>

#### `resetStores` `[exported]`

> If omitted, clear all cached stores.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function resetStores(pluginDataDir?: string): void {
  if (pluginDataDir) {
    _storeInitCache.delete(pluginDataDir);
  } else {
    _storeInitCache.clear();
  }
}

/**
 * Internal: actual store initialization logic (called once by the cache).
 */
async function _doInitStores(
  cfg: MemoryTdaiConfig,
  pluginDataDir: string,
  logger: PipelineLogger,
): Promise<StoreInitResult> {
  let vectorStore: IMemoryStore | undefined;
  let embeddingService: EmbeddingService | undefined;
  let nee
```
</details>

#### `createL1Runner` `[exported]`

> runs extractL1Memories for each group, and updates the checkpoint cursor.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function createL1Runner(opts: {
  pluginDataDir: string;
  cfg: MemoryTdaiConfig;
  openclawConfig: unknown;
  vectorStore: IMemoryStore | undefined;
  embeddingService: EmbeddingService | undefined;
  logger: PipelineLogger;
  /**
   * Getter for the plugin instance ID used for metric reporting.
   * Called at runner execution time (not at creation time) so that the ID is
   * available even when the runner is wired before instanceId is resolved.
   * Metrics are skipped when the getter 
```
</details>

#### `createPersister` `[exported]`

> Saves pipeline session states to the checkpoint file.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function createPersister(
  pluginDataDir: string,
  logger: PipelineLogger,
): (states: Record<string, PipelineSessionState>) => Promise<void> {
  return async (states) => {
    const checkpoint = new CheckpointManager(pluginDataDir, logger);
    await checkpoint.mergePipelineStates(states);
  };
}

// ============================
// L2 Runner factory
// ============================

/**
 * Create the standard L2 runner function (scene extraction).
 *
 * Reads L1 memory records (incremen
```
</details>

### Consts

#### `HOOK_POLICY_MIN_VERSION` `[exported]`

> recognised by the schema and enforced. See header comment.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export const HOOK_POLICY_MIN_VERSION: readonly [number, number, number] = [
  2026, 4, 24,
];

/**
 * Parse the leading `x.y.z` numeric prefix from a version string.
 *
 * Accepts:
 *   "2026.4.24"          -> [2026, 4, 24]
 *   "2026.4.24-beta.1"   -> [2026, 4, 24]
 *   "2026.5.3-1"         -> [2026, 5,  3]
 *   "2026.4.24.4"        -> [2026, 4, 24]   (extra segments ignored)
 *
 * Rejects (returns null):
 *   - Non-string values  (undefined / null / number / etc.)
 *   - "unknown" / ""     (no
```
</details>

#### `shouldCapture` `[exported]`

> Kept as an alias of `shouldExtractL1` for backward compatibility.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export const shouldCapture = shouldExtractL1;

// ============================
// Prompt Injection Detection
// ============================

/**
 * Known prompt-injection / jailbreak patterns.
 *
 * Covers:
 * 1. Instruction override — "ignore all previous instructions", etc.
 * 2. Role hijack — "you are now DAN", "act as root", etc.
 * 3. System/developer boundary probing — "system prompt", "developer message"
 * 4. XML/tag injection — opening tags that match our context boundaries
 * 5. Tool/
```
</details>

## Key Relationships

- (this file) → `node:fs/promises#fs` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `node:fs/promises#fs` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `node:crypto#randomBytes` _(import)_
- (this file) → `node:fs/promises#fs` _(import)_
- (this file) → `node:fs#fsSync` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `node:os#os` _(import)_
- (this file) → `node:url#fileURLToPath` _(import)_
- (this file) → `node:url#pathToFileURL` _(import)_
- (this file) → `openclaw/plugin-sdk/core#type { OpenClawPluginApi` _(import)_
- (this file) → `./env.js#getEnv` _(import)_
- (this file) → `../core/report/reporter.js#report` _(import)_
- (this file) → `node:fs#fs` _(import)_

## Suggested Tags

`#utils` `#config` `#hooks` `#storage`
