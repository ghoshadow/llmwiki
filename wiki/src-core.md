---
title: src/core
slug: src-core
created: '2026-05-19T03:56:46.021Z'
updated: '2026-05-19T03:56:46.021Z'
tags:
  - core
  - sqlite
  - memory
  - recall
  - persona
  - extraction
status: published
category: codebase
---
# Module: src/core

| Property | Value |
|----------|-------|
| Path | `src/core` |
| Files | 36 |
| Exported Symbols | 179 |
| Language | typescript |

## Files

- `conversation/l0-recorder.ts`
- `hooks/auto-capture.ts`
- `hooks/auto-recall.ts`
- `index.ts`
- `persona/persona-generator.ts`
- `persona/persona-trigger.ts`
- `profile/profile-sync.ts`
- `prompts/l1-dedup.ts`
- `prompts/l1-extraction.ts`
- `prompts/persona-generation.ts`
- `prompts/scene-extraction.ts`
- `record/l1-dedup.ts`
- `record/l1-extractor.ts`
- `record/l1-reader.ts`
- `record/l1-writer.ts`
- `report/reporter.ts`
- `scene/scene-extractor.ts`
- `scene/scene-format.ts`
- `scene/scene-index.ts`
- `scene/scene-navigation.ts`
- `seed/input.ts`
- `seed/seed-runtime.ts`
- `seed/types.ts`
- `store/bm25-client.ts`
- `store/bm25-local.ts`
- `store/embedding.ts`
- `store/factory.ts`
- `store/search-utils.ts`
- `store/sqlite.ts`
- `store/tcvdb-client.ts`
- `store/tcvdb.ts`
- `store/types.ts`
- `tdai-core.ts`
- `tools/conversation-search.ts`
- `tools/memory-search.ts`
- `types.ts`

## External Dependencies

- `@tencentdb-agent-memory/tcvdb-text`
- `node:crypto`
- `node:fs`
- `node:module`
- `node:path`
- `node:sqlite`
- `undici`

## Exported API

### Classs

#### `PersonaGenerator` `[exported]`

```typescript
export class PersonaGenerator {
```

<details>
<summary>Show code</summary>

```typescript
export class PersonaGenerator {
  private dataDir: string;
  private runner: LLMRunner;
  private logger: Logger | undefined;
  private backupCount: number;
  private instanceId: string | undefined;

  constructor(opts: {
    dataDir: string;
    config: unknown;
    model?: string;
    backupCount?: number;
    logger?: Logger;
    /** Plugin instance ID for metric reporting (optional) */
    instanceId?: string;
    /**
     * Host-neutral LLM runner. When provided, used instead of creating
  
```
</details>

#### `PersonaTrigger` `[exported]`

```typescript
export class PersonaTrigger {
```

<details>
<summary>Show code</summary>

```typescript
export class PersonaTrigger {
  private dataDir: string;
  private interval: number;
  private logger: TriggerLogger | undefined;

  constructor(opts: { dataDir: string; interval: number; logger?: TriggerLogger }) {
    this.dataDir = opts.dataDir;
    this.interval = opts.interval;
    this.logger = opts.logger;
  }

  async shouldGenerate(): Promise<TriggerResult> {
    const cpManager = new CheckpointManager(this.dataDir);
    const cp = await cpManager.read();
    this.logger?.debug?.(`${TAG
```
</details>

#### `SceneExtractor` `[exported]`

```typescript
export class SceneExtractor {
```

<details>
<summary>Show code</summary>

```typescript
export class SceneExtractor {
  private dataDir: string;
  private runner: LLMRunner;
  private maxScenes: number;
  private sceneBackupCount: number;
  private timeoutMs: number;
  private logger: ExtractorLogger | undefined;
  private instanceId: string | undefined;

  constructor(opts: SceneExtractorOptions) {
    this.dataDir = opts.dataDir;
    this.maxScenes = opts.maxScenes ?? 15;
    this.sceneBackupCount = opts.sceneBackupCount ?? 10;
    this.timeoutMs = opts.timeoutMs ?? 300_000; // 5
```
</details>

#### `SeedValidationError` `[exported]`

```typescript
export class SeedValidationError extends Error {
```

<details>
<summary>Show code</summary>

```typescript
export class SeedValidationError extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const summary = errors.map((e) => formatValidationError(e)).join("\n");
    super(`Seed input validation failed (${errors.length} error(s)):\n${summary}`);
    this.name = "SeedValidationError";
    this.errors = errors;
  }
}

function formatValidationError(e: ValidationError): string {
  const parts: string[] = [`  [${e.stage}]`];
  if (e.sourceIndex != 
```
</details>

#### `BM25Client` `[exported]`

```typescript
export class BM25Client {
```

<details>
<summary>Show code</summary>

```typescript
export class BM25Client {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly logger?: Logger;

  /** Cached health status to avoid repeated checks on every call. */
  private _healthy: boolean | undefined;
  private _lastHealthCheck = 0;
  private static readonly HEALTH_CHECK_INTERVAL_MS = 30_000; // re-check every 30s

  constructor(config: BM25ClientConfig, logger?: Logger) {
    this.baseUrl = config.serviceUrl.replace(/\/+$/, "");
    this.timeout = co
```
</details>

#### `BM25LocalEncoder` `[exported]`

```typescript
export class BM25LocalEncoder {
```

<details>
<summary>Show code</summary>

```typescript
export class BM25LocalEncoder {
  private readonly encoder: BM25Encoder;
  private readonly logger?: Logger;

  constructor(language: "zh" | "en" = "zh", logger?: Logger) {
    this.logger = logger;
    this.encoder = BM25Encoder.default(language);
    logger?.debug?.(`${TAG} Initialized BM25 local encoder (language=${language})`);
  }

  /**
   * Encode document texts for upsert (TF-based BM25 scoring).
   * Returns one SparseVector per input text.
   */
  encodeTexts(texts: string[]): SparseVe
```
</details>

#### `EmbeddingNotReadyError` `[exported]`

> Callers should catch this and fall back to keyword-only mode.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export class EmbeddingNotReadyError extends Error {
  constructor(message?: string) {
    super(message ?? "Local embedding model is not ready yet (still downloading or loading)");
    this.name = "EmbeddingNotReadyError";
  }
}

// ============================
// Logger interface
// ============================

interface Logger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const TAG = "[memory
```
</details>

#### `LocalEmbeddingService` `[exported]`

```typescript
export class LocalEmbeddingService implements EmbeddingService {
```

<details>
<summary>Show code</summary>

```typescript
export class LocalEmbeddingService implements EmbeddingService {
  private readonly modelPath: string;
  private readonly modelCacheDir?: string;
  private readonly logger?: Logger;
  private readonly importLlama: ImportLlamaFn;

  // Initialization state machine
  private initState: LocalInitState = "idle";
  private initPromise: Promise<void> | null = null;
  private initError: Error | null = null;
  private embeddingContext: {
    getEmbeddingFor: (text: string) => Promise<{ vector: Float32Ar
```
</details>

#### `OpenAIEmbeddingService` `[exported]`

```typescript
export class OpenAIEmbeddingService implements EmbeddingService {
```

<details>
<summary>Show code</summary>

```typescript
export class OpenAIEmbeddingService implements EmbeddingService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly dims: number;
  private readonly providerName: string;
  private readonly proxyUrl?: string;
  private readonly maxInputChars?: number;
  private readonly timeoutMs: number;
  private readonly logger?: Logger;

  constructor(config: OpenAIEmbeddingConfig, logger?: Logger) {
    if (!config.apiKey) {
      thr
```
</details>

#### `NoopEmbeddingService` `[exported]`

> vectors automatically from the text field during upsert/search.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export class NoopEmbeddingService implements EmbeddingService {
  embed(_text: string): Promise<Float32Array> {
    return Promise.resolve(new Float32Array(0));
  }

  embedBatch(texts: string[]): Promise<Float32Array[]> {
    return Promise.resolve(texts.map(() => new Float32Array(0)));
  }

  getDimensions(): number {
    return 0;
  }

  getProviderInfo(): EmbeddingProviderInfo {
    return { provider: "noop", model: "server-side" };
  }

  isReady(): boolean {
    return true;
  }

  startWa
```
</details>

#### `VectorStore` `[exported]`

```typescript
export class VectorStore implements IMemoryStore {
```

<details>
<summary>Show code</summary>

```typescript
export class VectorStore implements IMemoryStore {
  private db: DatabaseSync;
  private readonly dimensions: number;
  private readonly logger?: Logger;

  /** @see IMemoryStore.supportsDeferredEmbedding */
  readonly supportsDeferredEmbedding = true;

  /**
   * When `true`, the store is in a degraded state (e.g. sqlite-vec failed to
   * load, or init() encountered an unrecoverable error).  All public methods
   * become safe no-ops so the plugin never blocks the main OpenClaw flow.
   */
  p
```
</details>

#### `TcvdbApiError` `[exported]`

```typescript
export class TcvdbApiError extends Error {
```

<details>
<summary>Show code</summary>

```typescript
export class TcvdbApiError extends Error {
  readonly apiCode: number;
  constructor(path: string, code: number, msg: string) {
    super(`VectorDB ${path}: code=${code}, msg=${msg}`);
    this.name = "TcvdbApiError";
    this.apiCode = code;
  }
}

// ============================
// Client
// ============================

const TAG = "[memory-tdai][tcvdb-client]";
const MAX_RETRIES = 2;

export class TcvdbClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  priv
```
</details>

#### `TcvdbClient` `[exported]`

```typescript
export class TcvdbClient {
```

<details>
<summary>Show code</summary>

```typescript
export class TcvdbClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly database: string;
  private readonly timeout: number;
  private readonly logger?: StoreLogger;
  /** undici dispatcher for HTTPS + custom CA. */
  private readonly dispatcher?: Dispatcher;

  constructor(config: TcvdbClientConfig, logger?: StoreLogger) {
    this.baseUrl = config.url.replace(/\/+$/, "");
    this.authHeader = `Bearer account=${config.username}&api_key=${config
```
</details>

#### `TcvdbMemoryStore` `[exported]`

```typescript
export class TcvdbMemoryStore implements IMemoryStore {
```

<details>
<summary>Show code</summary>

```typescript
export class TcvdbMemoryStore implements IMemoryStore {
  private readonly client: TcvdbClient;
  private readonly embeddingModel: string;
  private readonly logger?: StoreLogger;
  private readonly bm25Encoder?: BM25LocalEncoder;
  private readonly l1Collection: string;
  private readonly l0Collection: string;
  private readonly profilesCollection: string;
  private degraded = false;

  /** Promise that resolves when async init completes. */
  private _initPromise: Promise<void> | undefined;

 
```
</details>

#### `TdaiCore` `[exported]`

```typescript
export class TdaiCore {
```

<details>
<summary>Show code</summary>

```typescript
export class TdaiCore {
  private hostAdapter: HostAdapter;
  private cfg: MemoryTdaiConfig;
  private logger: Logger;
  private dataDir: string;
  private runnerFactory: LLMRunnerFactory;
  private sessionFilter: SessionFilter;
  private instanceId?: string;

  // Lazy-initialized resources
  private vectorStore?: IMemoryStore;
  private embeddingService?: EmbeddingService;
  private scheduler?: MemoryPipelineManager;
  /**
   * Promise gate for the one-shot scheduler-start sequence.
   *
   * 
```
</details>

### Interfaces

#### `ConversationMessage` `[exported]`

```typescript
export interface ConversationMessage {
```

<details>
<summary>Show code</summary>

```typescript
export interface ConversationMessage {
  /** Unique message ID (used by L1 prompt for source_message_ids tracking) */
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // epoch ms
}

/**
 * Generate a short unique message ID.
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

/**
 * New flat format: one message per JSONL line.
 */
export interface L0MessageRecord {
  sessionKey: string;
  sessionI
```
</details>

#### `L0MessageRecord` `[exported]`

> New flat format: one message per JSONL line.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface L0MessageRecord {
  sessionKey: string;
  sessionId: string;
  recordedAt: string; // ISO timestamp
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number; // epoch ms
}

/**
 * A group of conversation messages (used by downstream consumers).
 * Each L0ConversationRecord represents one or more messages from the same recording event.
 */
export interface L0ConversationRecord {
  sessionKey: string;
  sessionId: string;
  recordedAt: string; // ISO time
```
</details>

#### `L0ConversationRecord` `[exported]`

> Each L0ConversationRecord represents one or more messages from the same recording event.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface L0ConversationRecord {
  sessionKey: string;
  sessionId: string;
  recordedAt: string; // ISO timestamp
  messageCount: number;
  messages: ConversationMessage[];
}

interface Logger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const TAG = "[memory-tdai][l0]";

// ============================
// Core function
// ============================

/**
 * Record a conversation round 
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

const TAG = "[memory-tdai][l0]";

// ============================
// Core function
// ============================

/**
 * Record a conversation round to the L0 JSONL file.
 *
 * Only records **incremental** messages (new since the last capture).
 * Uses `afterTimestamp` as the primary filter to skip already-captured history.
 *
 * @
```
</details>

#### `SessionIdMessageGroup` `[exported]`

> A group of conversation messages sharing the same sessionId.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface SessionIdMessageGroup {
  sessionId: string;
  messages: Array<ConversationMessage & { recordedAtMs: number }>;
}

/**
 * Read L0 messages for a session, grouped by sessionId.
 *
 * Within the same sessionKey, different sessionIds represent different conversation
 * instances (e.g. after /reset). L1 extraction should process each group independently
 * so that each group's sessionId is correctly associated with its extracted memories.
 *
 * When `limit` is provided, only the **n
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

export interface AutoCaptureResult {
  /** Whether the scheduler was notified (conversation count incremented) */
  schedulerNotified: boolean;
  /** Number of messages recorded to L0 */
  l0RecordedCount: number;
  /** Number of L0 message vectors written */
  l0VectorsWritten: number;
  /** Filtered messages for L1 immediate use */
```
</details>

#### `AutoCaptureResult` `[exported]`

```typescript
export interface AutoCaptureResult {
```

<details>
<summary>Show code</summary>

```typescript
export interface AutoCaptureResult {
  /** Whether the scheduler was notified (conversation count incremented) */
  schedulerNotified: boolean;
  /** Number of messages recorded to L0 */
  l0RecordedCount: number;
  /** Number of L0 message vectors written */
  l0VectorsWritten: number;
  /** Filtered messages for L1 immediate use */
  filteredMessages: ConversationMessage[];
}

/**
 * Generate a unique L0 record ID for vector indexing.
 * Includes an index to distinguish multiple messages withi
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

/** A single recalled L1 memory with its search score and type. */
export interface RecalledMemory {
  content: string;
  score: number;
  type: string;
}

export interface RecallResult {
  /** L1 relevant memories — prepended to user prompt text (dynamic, per-turn) */
  prependContext?: string;
  /** Stable recall context appended t
```
</details>

#### `RecalledMemory` `[exported]`

> A single recalled L1 memory with its search score and type.

```typescript
/** A single recalled L1 memory with its search score and type. */
```

<details>
<summary>Show code</summary>

```typescript
export interface RecalledMemory {
  content: string;
  score: number;
  type: string;
}

export interface RecallResult {
  /** L1 relevant memories — prepended to user prompt text (dynamic, per-turn) */
  prependContext?: string;
  /** Stable recall context appended to system prompt (persona, scene nav, tools guide — cacheable) */
  appendSystemContext?: string;

  // ── Metric payload (for pendingRecallCache in index.ts) ──
  /** L1 memories that were recalled (with scores), for metric reportin
```
</details>

#### `RecallResult` `[exported]`

```typescript
export interface RecallResult {
```

<details>
<summary>Show code</summary>

```typescript
export interface RecallResult {
  /** L1 relevant memories — prepended to user prompt text (dynamic, per-turn) */
  prependContext?: string;
  /** Stable recall context appended to system prompt (persona, scene nav, tools guide — cacheable) */
  appendSystemContext?: string;

  // ── Metric payload (for pendingRecallCache in index.ts) ──
  /** L1 memories that were recalled (with scores), for metric reporting */
  recalledL1Memories?: RecalledMemory[];
  /** L3 Persona raw content loaded during 
```
</details>

#### `ScoredRecord` 

```typescript
interface ScoredRecord {
```

<details>
<summary>Show code</summary>

```typescript
interface ScoredRecord {
  record: MemoryRecord;
  score: number;
}

/** Timing breakdown from memory search */
interface SearchTiming {
  ftsMs: number;
  embeddingMs: number;
  ftsHits: number;
  embeddingHits: number;
}

interface SearchResult {
  lines: string[];
  timing: SearchTiming;
}

/**
 * Search memories and return both formatted lines and structured details.
 *
 * This is a thin wrapper around `searchMemories` that also captures
 * the recalled memory metadata for metric reporting (
```
</details>

#### `SearchTiming` 

> Timing breakdown from memory search

```typescript
/** Timing breakdown from memory search */
```

<details>
<summary>Show code</summary>

```typescript
interface SearchTiming {
  ftsMs: number;
  embeddingMs: number;
  ftsHits: number;
  embeddingHits: number;
}

interface SearchResult {
  lines: string[];
  timing: SearchTiming;
}

/**
 * Search memories and return both formatted lines and structured details.
 *
 * This is a thin wrapper around `searchMemories` that also captures
 * the recalled memory metadata for metric reporting (agent_turn event).
 * It parses the returned formatted lines to extract type/content info.
 */
async function se
```
</details>

#### `SearchResult` 

```typescript
interface SearchResult {
```

<details>
<summary>Show code</summary>

```typescript
interface SearchResult {
  lines: string[];
  timing: SearchTiming;
}

/**
 * Search memories and return both formatted lines and structured details.
 *
 * This is a thin wrapper around `searchMemories` that also captures
 * the recalled memory metadata for metric reporting (agent_turn event).
 * It parses the returned formatted lines to extract type/content info.
 */
async function searchMemoriesWithDetails(
  userText: string,
  pluginDataDir: string,
  cfg: MemoryTdaiConfig,
  logger: Logger 
```
</details>

#### `FormatableMemory` 

> - [instruction] 用户要求回答时使用中文，保持简洁。

```typescript
*   - timestamp (点时间): when the activity/event happened, e.g. "2025-03-01 mentioned something"
```

<details>
<summary>Show code</summary>

```typescript
interface FormatableMemory {
  type: string;
  content: string;
  scene_name?: string;
  /** Activity time range start (段时间 start), may be empty */
  activity_start_time?: string;
  /** Activity time range end (段时间 end), may be empty */
  activity_end_time?: string;
  /** Activity point-in-time (点时间: when it happened), may be empty */
  timestamp?: string;
}

function formatMemoryLine(m: FormatableMemory): string {
  // 1. Type tag + optional scene name
  const tag = m.scene_name ? `${m.type}|${
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

export class PersonaGenerator {
  private dataDir: string;
  private runner: LLMRunner;
  private logger: Logger | undefined;
  private backupCount: number;
  private instanceId: string | undefined;

  constructor(opts: {
    dataDir: string;
    config: unknown;
    model?: string;
    backupCount?: number;
    logger?: Logger;
    
```
</details>

#### `TriggerLogger` 

```typescript
interface TriggerLogger {
```

<details>
<summary>Show code</summary>

```typescript
interface TriggerLogger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface TriggerResult {
  should: boolean;
  reason: string;
}

export class PersonaTrigger {
  private dataDir: string;
  private interval: number;
  private logger: TriggerLogger | undefined;

  constructor(opts: { dataDir: string; interval: number; logger?: TriggerLogger }) {
    this.dataDir = opts.dataDir;
    th
```
</details>

#### `TriggerResult` `[exported]`

```typescript
export interface TriggerResult {
```

<details>
<summary>Show code</summary>

```typescript
export interface TriggerResult {
  should: boolean;
  reason: string;
}

export class PersonaTrigger {
  private dataDir: string;
  private interval: number;
  private logger: TriggerLogger | undefined;

  constructor(opts: { dataDir: string; interval: number; logger?: TriggerLogger }) {
    this.dataDir = opts.dataDir;
    this.interval = opts.interval;
    this.logger = opts.logger;
  }

  async shouldGenerate(): Promise<TriggerResult> {
    const cpManager = new CheckpointManager(this.dataDir
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

export interface ProfileBaseline {
  version: number;
  contentMd5: string;
  createdAtMs: number;
}

export function buildProfileStableId(scope: string, type: "l2" | "l3", filename: string): string {
  const hash = createHash("sha256")
    .update(`${scope}\u0000${type}\u0000${filename}`)
    .digest("hex");
  return `profile:v1:${h
```
</details>

#### `ProfileBaseline` `[exported]`

```typescript
export interface ProfileBaseline {
```

<details>
<summary>Show code</summary>

```typescript
export interface ProfileBaseline {
  version: number;
  contentMd5: string;
  createdAtMs: number;
}

export function buildProfileStableId(scope: string, type: "l2" | "l3", filename: string): string {
  const hash = createHash("sha256")
    .update(`${scope}\u0000${type}\u0000${filename}`)
    .digest("hex");
  return `profile:v1:${hash}`;
}

function md5(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

async function statTimes(filePath: string): Promise<{ create
```
</details>

#### `CandidateMatch` `[exported]`

> Candidate search result for a single new memory.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface CandidateMatch {
  newMemory: ExtractedMemory & { record_id: string };
  candidates: MemoryRecord[];
}

/**
 * Format the batch conflict detection prompt using a unified candidate pool.
 *
 * Format (aligned with prototype):
 * 1. Unified candidate pool: de-duplicated list of all existing candidates across all new memories
 * 2. Per new memory: content + list of related candidate IDs from the pool
 *
 * This approach lets the LLM see the global picture and handle cross-memory de
```
</details>

### Types

#### `MemoryType` `[exported]`

> v3: 3 memory types aligned with Kenty's extraction prompt

```typescript
/** v3: 3 memory types aligned with Kenty's extraction prompt */
```

<details>
<summary>Show code</summary>

```typescript
export type MemoryType = "persona" | "episodic" | "instruction";

/** Metadata for episodic memories (activity time range) */
export interface EpisodicMetadata {
  activity_start_time?: string; // ISO 8601
  activity_end_time?: string; // ISO 8601
}

/**
 * A persisted memory record in L1 JSONL files.
 *
 * v3 changes from v2:
 * - `importance: "high"|"medium"|"low"` → `priority: number` (0-100, -1 for strict global instructions)
 * - Added `scene_name`, `source_message_ids`, `metadata`, `timest
```
</details>

#### `DedupAction` `[exported]`

> Scene name this memory was extracted in

```typescript
export type DedupAction = "store" | "update" | "merge" | "skip";
```

<details>
<summary>Show code</summary>

```typescript
export type DedupAction = "store" | "update" | "merge" | "skip";

/**
 * v3 batch dedup decision — one per new memory, aligned with Kenty's conflict detection prompt.
 *
 * Key changes:
 * - `targetId` → `target_ids` (array, supports multi-target merge/update)
 * - Added `merged_type`, `merged_priority`, `merged_timestamps` for cross-type merge
 */
export interface DedupDecision {
  /** Which new memory this decision is about */
  record_id: string;
  action: DedupAction;
  /** IDs of existing r
```
</details>

#### `ReportPayload` `[exported]`

```typescript
export type ReportPayload = Record<string, unknown>;
```

<details>
<summary>Show code</summary>

```typescript
export type ReportPayload = Record<string, unknown>;

export interface IReporter {
  reportFunc(category: string, payload: ReportPayload): void;
}

// ── Singleton ──

let _reporter: IReporter | undefined;

export function initReporter(opts: {
  enabled: boolean;
  type: string;
  logger: { info: (msg: string) => void; debug?: (msg: string) => void };
  instanceId: string;
  pluginVersion: string;
}): void {
  if (_reporter) return;
  if (!opts.enabled) return;
  switch (opts.type) {
    case "l
```
</details>

#### `FormatB` `[exported]`

> Format B: `[...]` (top-level array of sessions)

```typescript
/** Format B: `[...]` (top-level array of sessions) */
```

<details>
<summary>Show code</summary>

```typescript
export type FormatB = RawSession[];

// ============================
// Normalized types (after validation)
// ============================

export interface NormalizedMessage {
  role: string;
  content: string;
  /** Epoch ms — always present after normalization (filled if originally missing). */
  timestamp: number;
}

export interface NormalizedRound {
  messages: NormalizedMessage[];
}

export interface NormalizedSession {
  sessionKey: string;
  sessionId: string;
  rounds: NormalizedRound
```
</details>

#### `ValidationStage` `[exported]`

> Stages where a validation error can occur.

```typescript
/** Stages where a validation error can occur. */
```

<details>
<summary>Show code</summary>

```typescript
export type ValidationStage =
  | "file"
  | "top_level"
  | "session"
  | "round"
  | "message"
  | "timestamp_consistency";

/** A single validation error with location context. */
export interface ValidationError {
  stage: ValidationStage;
  sourceIndex?: number;
  sessionKey?: string;
  roundIndex?: number;
  messageIndex?: number;
  message: string;
}

// ============================
// Seed command options (from CLI)
// ============================

export interface SeedCommandOptions {
 
```
</details>

#### `SparseVector` `[exported]`

> Sparse vector: array of [token_hash, weight] pairs.

```typescript
* Graceful degradation: if the sidecar is unreachable, all methods
```

<details>
<summary>Show code</summary>

```typescript
export type SparseVector = Array<[number, number]>;

interface Logger {
  debug?: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface BM25ClientConfig {
  /** Sidecar service URL (default: "http://127.0.0.1:8084") */
  serviceUrl: string;
  /** Request timeout in ms (default: 5000) */
  timeout: number;
}

interface EncodeResponse {
  vectors: SparseVector[];
}

// ============================
//
```
</details>

#### `EmbeddingConfig` `[exported]`

> Model cache directory (default: node-llama-cpp default cache)

```typescript
export type EmbeddingConfig = OpenAIEmbeddingConfig | LocalEmbeddingConfig;
```

<details>
<summary>Show code</summary>

```typescript
export type EmbeddingConfig = OpenAIEmbeddingConfig | LocalEmbeddingConfig;

/** Identifies the embedding provider + model for change detection. */
export interface EmbeddingProviderInfo {
  /** Provider identifier (e.g. "local", "openai", "deepseek") */
  provider: string;
  /** Model identifier (e.g. "embeddinggemma-300m", "text-embedding-3-large") */
  model: string;
}

export interface EmbeddingCallOptions {
  /** Override the default timeout for this call (milliseconds). */
  timeoutMs?: nu
```
</details>

#### `LocalInitState` 

> - "failed":       initialization failed (will retry on next startWarmup)

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
type LocalInitState = "idle" | "initializing" | "ready" | "failed";

/** Function that dynamically imports node-llama-cpp. Overridable for testing. */
export type ImportLlamaFn = () => Promise<{
  getLlama: (opts: { logLevel: number }) => Promise<unknown>;
  resolveModelFile: (model: string, cacheDir?: string) => Promise<string>;
  LlamaLogLevel: { error: number };
}>;

const defaultImportLlama: ImportLlamaFn = () => import("node-llama-cpp") as unknown as ReturnType<ImportLlamaFn>;

export class
```
</details>

#### `ImportLlamaFn` `[exported]`

> Function that dynamically imports node-llama-cpp. Overridable for testing.

```typescript
/** Function that dynamically imports node-llama-cpp. Overridable for testing. */
```

<details>
<summary>Show code</summary>

```typescript
export type ImportLlamaFn = () => Promise<{
  getLlama: (opts: { logLevel: number }) => Promise<unknown>;
  resolveModelFile: (model: string, cacheDir?: string) => Promise<string>;
  LlamaLogLevel: { error: number };
}>;

const defaultImportLlama: ImportLlamaFn = () => import("node-llama-cpp") as unknown as ReturnType<ImportLlamaFn>;

export class LocalEmbeddingService implements EmbeddingService {
  private readonly modelPath: string;
  private readonly modelCacheDir?: string;
  private readonl
```
</details>

#### `MaybePromise` `[exported]`

> Callers should always `await` the result — it's safe for both sync and async values.

```typescript
* - `SqliteMemoryStore` (sqlite.ts) — local SQLite + sqlite-vec + FTS5
```

<details>
<summary>Show code</summary>

```typescript
export type MaybePromise<T> = T | Promise<T>;

export interface IMemoryStore {
  // ── Capabilities ───────────────────────────────────────────

  /**
   * Whether this store supports deferred (background) embedding updates.
   *
   * When `true`, auto-capture writes metadata-only via `upsertL0(record, undefined)`
   * and later calls `updateL0Embedding()` in a fire-and-forget background task.
   * When `false` or absent, embedding is computed inline and passed to `upsertL0()`.
   */
  readonly 
```
</details>

### Functions

#### `buildProfileStableId` `[exported]`

```typescript
export function buildProfileStableId(scope: string, type: "l2" | "l3", filename: string): string {
```

<details>
<summary>Show code</summary>

```typescript
export function buildProfileStableId(scope: string, type: "l2" | "l3", filename: string): string {
  const hash = createHash("sha256")
    .update(`${scope}\u0000${type}\u0000${filename}`)
    .digest("hex");
  return `profile:v1:${hash}`;
}

function md5(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

async function statTimes(filePath: string): Promise<{ createdAtMs: number; updatedAtMs: number }> {
  try {
    const stat = await fs.stat(filePath);
    return {
```
</details>

#### `formatBatchConflictPrompt` `[exported]`

> This approach lets the LLM see the global picture and handle cross-memory dedup in one pass.

```typescript
* Format the batch conflict detection prompt using a unified candidate pool.
```

<details>
<summary>Show code</summary>

```typescript
export function formatBatchConflictPrompt(matches: CandidateMatch[]): string {
  // Step 1: Build unified candidate pool (de-duplicate across all new memories)
  const unifiedPool = new Map<string, MemoryRecord>();
  const perMemoryCandidateIds = new Map<string, string[]>();

  for (const m of matches) {
    const candidateIds: string[] = [];
    for (const c of m.candidates) {
      if (!unifiedPool.has(c.id)) {
        unifiedPool.set(c.id, c);
      }
      candidateIds.push(c.id);
    }
    
```
</details>

#### `formatExtractionPrompt` `[exported]`

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function formatExtractionPrompt(params: {
  newMessages: ConversationMessage[];
  backgroundMessages?: ConversationMessage[];
  previousSceneName?: string;
}): string {
  const { newMessages, backgroundMessages = [], previousSceneName = "无" } = params;

  const bgText = backgroundMessages.length > 0
    ? backgroundMessages
        .map((m) => `[${m.id}] [${m.role}] [${new Date(m.timestamp).toISOString()}]: ${m.content}`)
        .join("\n\n")
    : "无";

  const newText = newMessages
   
```
</details>

#### `buildPersonaPrompt` `[exported]`

```typescript
export function buildPersonaPrompt(params: PersonaPromptParams): PersonaPromptResult {
```

<details>
<summary>Show code</summary>

```typescript
export function buildPersonaPrompt(params: PersonaPromptParams): PersonaPromptResult {
  const {
    mode,
    currentTime,
    totalProcessed,
    sceneCount,
    changedSceneCount,
    changedScenesContent,
    existingPersona,
    triggerInfo,
  } = params;

  const modeLabel = mode === "first" ? "🆕 首次生成" : "🔄 迭代更新";

  const triggerSection = triggerInfo
    ? `\n### 触发信息\n${triggerInfo}\n`
    : "";

  const existingPersonaSection = existingPersona
    ? `\n## 📄 当前 Persona（工程已预加载）\n\n` +

```
</details>

#### `buildSceneExtractionPrompt` `[exported]`

```typescript
export function buildSceneExtractionPrompt(params: SceneExtractionPromptParams): SceneExtractionPromptResult {
```

<details>
<summary>Show code</summary>

```typescript
export function buildSceneExtractionPrompt(params: SceneExtractionPromptParams): SceneExtractionPromptResult {
  const {
    memoriesJson,
    sceneSummaries,
    currentTimestamp,
    sceneCountWarning,
    existingSceneFiles,
    maxScenes,
  } = params;

  const warningSection = sceneCountWarning
    ? `\n⚠️ **场景数量警告**: ${sceneCountWarning}\n`
    : "";

  const fileListSection = existingSceneFiles && existingSceneFiles.length > 0
    ? `### 📁 已有场景文件清单（仅以下文件可 read）\n${existingSceneFiles.map(
```
</details>

#### `generateMemoryId` `[exported]`

> Generate a unique memory ID.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function generateMemoryId(): string {
  return `m_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Write a memory record according to the dedup decision.
 *
 * - store: append new record
 * - update: remove target records + append updated record
 * - merge: remove target records + append merged record
 * - skip: do nothing
 *
 * v3: supports multi-target removal for update/merge.
 * v3.1: optional VectorStore + EmbeddingService for dual-write (JSONL + vector).
 */
export
```
</details>

#### `initReporter` `[exported]`

```typescript
export function initReporter(opts: {
```

<details>
<summary>Show code</summary>

```typescript
export function initReporter(opts: {
  enabled: boolean;
  type: string;
  logger: { info: (msg: string) => void; debug?: (msg: string) => void };
  instanceId: string;
  pluginVersion: string;
}): void {
  if (_reporter) return;
  if (!opts.enabled) return;
  switch (opts.type) {
    case "local":
      _reporter = new LocalReporter(opts.logger, opts.instanceId, opts.pluginVersion);
      break;
    // TODO: add new reporter type
    default:
      opts.logger.debug?.(`[memory-tdai] Unknown rep
```
</details>

#### `setReporter` `[exported]`

```typescript
export function setReporter(reporter: IReporter): void {
```

<details>
<summary>Show code</summary>

```typescript
export function setReporter(reporter: IReporter): void {
  _reporter = reporter;
}

/**
 * Reset the reporter singleton so that the next `initReporter` call takes effect.
 * Must be called at plugin re-registration (hot-reload) to pick up config changes.
 */
export function resetReporter(): void {
  _reporter = undefined;
}

export function report(event: string, data: ReportPayload): void {
  if (!_reporter) return;
  try {
    _reporter.reportFunc(REPORT_CONST.PLUGIN, { event, ...data });
  } c
```
</details>

#### `resetReporter` `[exported]`

> Must be called at plugin re-registration (hot-reload) to pick up config changes.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function resetReporter(): void {
  _reporter = undefined;
}

export function report(event: string, data: ReportPayload): void {
  if (!_reporter) return;
  try {
    _reporter.reportFunc(REPORT_CONST.PLUGIN, { event, ...data });
  } catch { /* never block business logic */ }
}

// ── LocalReporter (default) ──

class LocalReporter implements IReporter {
  constructor(
    private readonly logger: { info: (msg: string) => void },
    private readonly instanceId: string,
    private readonl
```
</details>

#### `report` `[exported]`

```typescript
export function report(event: string, data: ReportPayload): void {
```

<details>
<summary>Show code</summary>

```typescript
export function report(event: string, data: ReportPayload): void {
  if (!_reporter) return;
  try {
    _reporter.reportFunc(REPORT_CONST.PLUGIN, { event, ...data });
  } catch { /* never block business logic */ }
}

// ── LocalReporter (default) ──

class LocalReporter implements IReporter {
  constructor(
    private readonly logger: { info: (msg: string) => void },
    private readonly instanceId: string,
    private readonly pluginVersion: string,
  ) {}

  reportFunc(category: string, payl
```
</details>

#### `parsePersonaUpdateSignal` `[exported]`

> - Inline: PERSONA_UPDATE_REQUEST: xxx

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function parsePersonaUpdateSignal(text: string): { reason: string } | null {
  // Block format: [PERSONA_UPDATE_REQUEST]...[/PERSONA_UPDATE_REQUEST]
  const blockMatch = text.match(
    /\[PERSONA_UPDATE_REQUEST\]\s*(?:reason:\s*)?(.+?)\s*\[\/PERSONA_UPDATE_REQUEST\]/s,
  );
  if (blockMatch) return { reason: blockMatch[1]!.trim() };

  // Inline format: PERSONA_UPDATE_REQUEST: reason text
  const inlineMatch = text.match(
    /PERSONA_UPDATE_REQUEST:\s*(.+?)(?:\n|$)/,
  );
  if (inlineMa
```
</details>

#### `parseSceneBlock` `[exported]`

> Parse a Scene Block file into structured data.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function parseSceneBlock(raw: string, filename: string): SceneBlock {
  const startIdx = raw.indexOf(META_START);
  const endIdx = raw.indexOf(META_END);

  if (startIdx === -1 || endIdx === -1) {
    // No META section — treat entire file as content
    return {
      filename,
      meta: { created: "", updated: "", summary: "", heat: 0 },
      content: raw.trim(),
    };
  }

  const metaBlock = raw.slice(startIdx + META_START.length, endIdx).trim();
  const content = raw.slice(endIdx
```
</details>

#### `formatSceneBlock` `[exported]`

> Format a Scene Block back into file content.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function formatSceneBlock(meta: SceneBlockMeta, content: string): string {
  return `${formatMeta(meta)}\n\n${content}`;
}

/**
 * Format the META section.
 */
export function formatMeta(meta: SceneBlockMeta): string {
  return [
    META_START,
    `created: ${meta.created}`,
    `updated: ${meta.updated}`,
    `summary: ${meta.summary}`,
    `heat: ${meta.heat}`,
    META_END,
  ].join("\n");
}

function extractMetaField(metaBlock: string, field: string): string {
  const re = new RegEx
```
</details>

#### `formatMeta` `[exported]`

> Format the META section.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function formatMeta(meta: SceneBlockMeta): string {
  return [
    META_START,
    `created: ${meta.created}`,
    `updated: ${meta.updated}`,
    `summary: ${meta.summary}`,
    `heat: ${meta.heat}`,
    META_END,
  ].join("\n");
}

function extractMetaField(metaBlock: string, field: string): string {
  const re = new RegExp(`^${field}:\\s*(.*)$`, "m");
  const m = metaBlock.match(re);
  return m ? m[1]!.trim() : "";
}
```
</details>

#### `generateSceneNavigation` `[exported]`

> call read_file directly without path concatenation.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function generateSceneNavigation(entries: SceneIndexEntry[], dataDir?: string): string {
  if (entries.length === 0) return "";

  const sorted = [...entries].sort((a, b) => b.heat - a.heat);

  const blocks = sorted.map((e) => {
    const scenePath = dataDir
      ? path.join(dataDir, "scene_blocks", e.filename)
      : `scene_blocks/${e.filename}`;
    const pathLine = `### Path: ${scenePath}`;
    const heatLine = `**热度**: ${e.heat}${heatEmoji(e.heat)}${e.updated ? ` | **更新**: ${e.upda
```
</details>

#### `stripSceneNavigation` `[exported]`

> Strip the scene navigation section from persona content.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function stripSceneNavigation(personaContent: string): string {
  const idx = personaContent.indexOf(NAV_HEADER);
  if (idx === -1) return personaContent;
  return personaContent.slice(0, idx).trimEnd();
}
```
</details>

#### `loadAndValidateInput` `[exported]`

> that includes all collected errors.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function loadAndValidateInput(
  opts: Pick<SeedCommandOptions, "input" | "sessionKey" | "strictRoundRole">,
): LoadAndValidateResult {
  // Layer 1: File — read + parse
  const raw = loadRawInput(opts.input);

  // Layer 2: Top-level — detect A vs B
  const sessions = extractSessions(raw);

  // Layers 3-5: session / round / message validation
  const errors: ValidationError[] = [];
  validateSessions(sessions, opts.strictRoundRole, errors);

  if (errors.length > 0) {
    throw new Seed
```
</details>

#### `validateAndNormalizeRaw` `[exported]`

> Throws `SeedValidationError` on validation failures.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function validateAndNormalizeRaw(
  raw: unknown,
  opts?: { sessionKey?: string; strictRoundRole?: boolean; autoFillTimestamps?: boolean },
): NormalizedInput {
  const strictRoundRole = opts?.strictRoundRole ?? false;
  const autoFillTimestamps = opts?.autoFillTimestamps ?? true;

  // Layer 2: Top-level — detect A vs B
  const sessions = extractSessions(raw);

  // Layers 3-5: session / round / message validation
  const errors: ValidationError[] = [];
  validateSessions(sessions, stri
```
</details>

#### `fillTimestamps` `[exported]`

> below the cursor if ordering were not globally monotonic.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function fillTimestamps(input: NormalizedInput): void {
  let currentTs = Date.now();
  for (const session of input.sessions) {
    for (const round of session.rounds) {
      for (let i = 0; i < round.messages.length; i++) {
        // Small offset per message to maintain strict ordering
        round.messages[i]!.timestamp = currentTs;
        currentTs += 100;
      }
    }
  }
  input.hasTimestamps = true;
}

// ============================
// Validation error class
// ===============
```
</details>

#### `createBM25Client` `[exported]`

> Returns undefined if disabled — callers should check before using.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function createBM25Client(
  config: { enabled: boolean; serviceUrl: string; timeout: number },
  logger?: Logger,
): BM25Client | undefined {
  if (!config.enabled) {
    logger?.info(`${TAG} BM25 sparse encoding disabled`);
    return undefined;
  }
  logger?.info(`${TAG} BM25 client → ${config.serviceUrl}`);
  return new BM25Client(
    { serviceUrl: config.serviceUrl, timeout: config.timeout },
    logger,
  );
}
```
</details>

### Consts

#### `CONFLICT_DETECTION_SYSTEM_PROMPT` `[exported]`

```typescript
export const CONFLICT_DETECTION_SYSTEM_PROMPT = `你是记忆冲突检测器。批量比较多条【新记忆】与【统一候选记忆池】中的已有记忆，逐条决定如何处理。
```

<details>
<summary>Show code</summary>

```typescript
export const CONFLICT_DETECTION_SYSTEM_PROMPT = `你是记忆冲突检测器。批量比较多条【新记忆】与【统一候选记忆池】中的已有记忆，逐条决定如何处理。

## 核心规则

- **跨 type 合并**：不同 type（persona / episodic / instruction）的记忆如果语义上描述同一事实/事件，**可以合并**。
- **多对多合并**：一条新记忆可以同时替换/合并候选池中的**多条**已有记忆（通过 target_ids 数组指定）。
- 合并后你必须判断新记忆的最佳 type（merged_type）。

## 判断逻辑

1. **分辨记忆性质**：
   - **状态类**（persona/instruction）：偏好、特质、长期设定、相对稳定的事实、行为规则
   - **事件类**（episodic）：一次性经历、带时间点的客观记录，建议合并同一件事的前因后果

2. **判断是否同一事实/事件**：主体相同、主题一致、时间接近、scene_name 相似

3. **选择动作**：
   - "stor
```
</details>

#### `EXTRACT_MEMORIES_SYSTEM_PROMPT` `[exported]`

```typescript
export const EXTRACT_MEMORIES_SYSTEM_PROMPT = `你是专业的"情境切分与记忆提取专家"。
```

<details>
<summary>Show code</summary>

```typescript
export const EXTRACT_MEMORIES_SYSTEM_PROMPT = `你是专业的"情境切分与记忆提取专家"。
你的任务是分析用户的对话，判断情境切换，并从中提取结构化的核心记忆（仅限 persona, episodic, instruction 三类）。

### 任务一：情境切分（Scene Segmentation）
分析【待提取的新消息】，结合【上一个情境】，判断并输出当前对话的情境。
- 继承：无明显切换，沿用上一个情境。
- 切换条件：用户发出明确指令（如"换话题"）、意图转变、或提出独立新目标。
- 一段对话可能只有一个情境，也可能有多个情境（话题多次切换时）。
- 命名规则："我（AI）在和xxx（用户身份）做xxx（目标活动）"（中文，30-50字，单句，全局唯一）。

---

### 任务二：核心记忆提取（Memory Extraction）
结合背景和当前情境，仅从【待提取的新消息】中提取核心信息。

【通用提取原则】
1. 宁缺毋滥：过滤琐碎闲聊、临时性指令和一次性操作（如"这次、本单"）；剔除不可靠的边缘信息。
2. 独立完整：记忆必须
```
</details>

#### `REPORT_CONST` `[exported]`

```typescript
export const REPORT_CONST = {
```

<details>
<summary>Show code</summary>

```typescript
export const REPORT_CONST = {
  PLUGIN: "plugin",
} as const;

export type ReportPayload = Record<string, unknown>;

export interface IReporter {
  reportFunc(category: string, payload: ReportPayload): void;
}

// ── Singleton ──

let _reporter: IReporter | undefined;

export function initReporter(opts: {
  enabled: boolean;
  type: string;
  logger: { info: (msg: string) => void; debug?: (msg: string) => void };
  instanceId: string;
  pluginVersion: string;
}): void {
  if (_reporter) return;

```
</details>

#### `RRF_K` `[exported]`

> Higher k → more weight on lower-ranked items (smoother distribution).

```typescript
*/
```

<details>
<summary>Show code</summary>

```typescript
export const RRF_K = 60;

/**
 * Merge multiple ranked lists via Reciprocal Rank Fusion.
 *
 * Each item's RRF score = sum over all lists of 1/(k + rank + 1).
 * Items appearing in multiple lists get their scores summed.
 *
 * @param lists   Array of ranked lists. Each list must have items with an `id` field.
 * @param k       RRF constant (default: 60).
 * @returns       Merged list sorted by descending RRF score, with `rrfScore` attached.
 *
 * @example
 * ```ts
 * const merged = rrfMerge(
 * 
```
</details>

## Key Relationships

- (this file) → `node:fs/promises#fs` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `node:crypto#crypto` _(import)_
- (this file) → `../../utils/sanitize.js#sanitizeText` _(import)_
- (this file) → `../../utils/sanitize.js#stripCodeBlocks` _(import)_
- (this file) → `../../utils/sanitize.js#shouldCaptureL0` _(import)_
- (this file) → `node:crypto#crypto` _(import)_
- (this file) → `../../config.js#type { MemoryTdaiConfig` _(import)_
- (this file) → `../../utils/checkpoint.js#CheckpointManager` _(import)_
- (this file) → `../../utils/pipeline-manager.js#type { MemoryPipelineManager` _(import)_
- (this file) → `../conversation/l0-recorder.js#recordConversation` _(import)_
- (this file) → `../conversation/l0-recorder.js#type { ConversationMessage` _(import)_
- (this file) → `../store/types.js#type { IMemoryStore` _(import)_
- (this file) → `../store/types.js#L0Record` _(import)_
- (this file) → `../store/embedding.js#type { EmbeddingService` _(import)_

## Suggested Tags

`#core` `#sqlite` `#memory` `#recall` `#persona` `#extraction`
