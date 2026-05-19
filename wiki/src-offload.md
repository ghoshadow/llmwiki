---
title: src/offload
slug: src-offload
created: '2026-05-19T03:56:46.110Z'
updated: '2026-05-19T03:56:46.110Z'
tags:
  - offload
  - llm
  - storage
  - config
status: published
category: codebase
---
# Module: src/offload

| Property | Value |
|----------|-------|
| Path | `src/offload` |
| Files | 32 |
| Exported Symbols | 136 |
| Language | typescript |

## Files

- `backend-client.ts`
- `context-token-tracker.ts`
- `hooks/after-tool-call.ts`
- `hooks/before-agent-start.ts`
- `hooks/before-prompt-build.ts`
- `hooks/llm-input-l3.ts`
- `hooks/llm-output.ts`
- `index.ts`
- `l3-helpers.ts`
- `l3-token-counter.ts`
- `l3-token-helpers.ts`
- `local-llm/index.ts`
- `local-llm/llm-caller.ts`
- `local-llm/parsers/json-utils.ts`
- `local-llm/parsers/l1-parser.ts`
- `local-llm/parsers/l15-parser.ts`
- `local-llm/parsers/l2-parser.ts`
- `local-llm/prompts/l1-prompt.ts`
- `local-llm/prompts/l15-prompt.ts`
- `local-llm/prompts/l2-prompt.ts`
- `mmd-injector.ts`
- `mmd-meta.ts`
- `opik-tracer.ts`
- `pipelines/l2-mermaid.ts`
- `reclaimer.ts`
- `session-registry.ts`
- `state-manager.ts`
- `state-reporter.ts`
- `storage.ts`
- `time-utils.ts`
- `types.ts`
- `user-id.ts`

## External Dependencies

- `@ai-sdk/openai`
- `ai`
- `js-tiktoken`
- `node:crypto`
- `node:fs`
- `node:http`
- `node:https`
- `node:os`
- `node:path`

## Exported API

### Classs

#### `BackendClient` `[exported]`

```typescript
export class BackendClient {
```

<details>
<summary>Show code</summary>

```typescript
export class BackendClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  /** Hardcoded timeout for all backend calls (L1/L1.5/L2/L4) */
  private static readonly TIMEOUT_MS = 120_000;
  private logger: PluginLogger;
  private sessionKeyFn: () => string | null;
  /** Resolves the value of the `X-User-Id` header sent on every call. */
  private userIdFn: () => string | null;
  /** Resolves the value of the `X-Task-Id` header sent on every call (optional). */
  private taskId
```
</details>

#### `LocalLlmClient` `[exported]`

```typescript
export class LocalLlmClient {
```

<details>
<summary>Show code</summary>

```typescript
export class LocalLlmClient {
  private config: LlmCallerConfig;
  private logger?: PluginLogger;

  constructor(cfg: LocalLlmClientConfig, logger?: PluginLogger) {
    this.config = {
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      model: cfg.model,
      temperature: cfg.temperature ?? 0.2,
      timeoutMs: cfg.timeoutMs ?? 120_000,
    };
    this.logger = logger;
    logger?.info?.(`${TAG} Initialized: model=${cfg.model}, baseUrl=${cfg.baseUrl}`);
  }

  // ─── L1 Summarize ─────
```
</details>

#### `SessionRegistry` `[exported]`

> Routes sessionKey → per-session OffloadStateManager with LRU eviction.

```typescript
/** Routes sessionKey → per-session OffloadStateManager with LRU eviction. */
```

<details>
<summary>Show code</summary>

```typescript
export class SessionRegistry {
  private _sessions = new Map<string, SessionCtx>();
  private _dataRoot: string;
  readonly _registryId = ++SessionRegistry._registryCounter;
  private static _registryCounter = 0;

  constructor(dataRoot: string) {
    this._dataRoot = dataRoot;
  }

  /** Get the configured data root. */
  get dataRoot(): string {
    return this._dataRoot;
  }

  /**
   * Get or create a per-session manager.
   * First access will create a new OffloadStateManager, call init() +
```
</details>

#### `OffloadStateManager` `[exported]`

```typescript
export class OffloadStateManager {
```

<details>
<summary>Show code</summary>

```typescript
export class OffloadStateManager {
  /** Immutable storage path context — set by init() or switchSession() */
  private _ctx: StorageContext | null = null;

  /** Buffered tool pairs waiting to be processed by L1 */
  pendingToolPairs: Array<ToolPair & { _sessionId?: string | null }> = [];
  /** Set of already-processed tool call IDs to prevent duplicates */
  processedToolCallIds = new Set<string>();
  /** Persistent state (synced with state.json) */
  private state: PluginState & { estimatedSy
```
</details>

### Interfaces

#### `L1Request` `[exported]`

```typescript
export interface L1Request {
```

<details>
<summary>Show code</summary>

```typescript
export interface L1Request {
  recentMessages: string;
  toolPairs: Array<{
    toolName: string;
    toolCallId: string;
    params: unknown;
    result: unknown;
    timestamp: string;
  }>;
  pluginConfig?: Record<string, unknown>;
}

export interface L1Response {
  entries: OffloadEntry[];
}

export interface L15Request {
  recentMessages: string;
  currentMmd?: {
    filename: string;
    content: string;
    path: string;
  } | null;
  availableMmdMetas: Array<{
    filename: string;
    p
```
</details>

#### `L1Response` `[exported]`

```typescript
export interface L1Response {
```

<details>
<summary>Show code</summary>

```typescript
export interface L1Response {
  entries: OffloadEntry[];
}

export interface L15Request {
  recentMessages: string;
  currentMmd?: {
    filename: string;
    content: string;
    path: string;
  } | null;
  availableMmdMetas: Array<{
    filename: string;
    path: string;
    taskGoal: string;
    doneCount: number;
    doingCount: number;
    todoCount: number;
    updatedTime?: string | null;
    nodeSummaries?: Array<{ nodeId: string; status: string; summary: string }>;
  }>;
}

export inte
```
</details>

#### `L15Request` `[exported]`

```typescript
export interface L15Request {
```

<details>
<summary>Show code</summary>

```typescript
export interface L15Request {
  recentMessages: string;
  currentMmd?: {
    filename: string;
    content: string;
    path: string;
  } | null;
  availableMmdMetas: Array<{
    filename: string;
    path: string;
    taskGoal: string;
    doneCount: number;
    doingCount: number;
    todoCount: number;
    updatedTime?: string | null;
    nodeSummaries?: Array<{ nodeId: string; status: string; summary: string }>;
  }>;
}

export interface L15Response extends TaskJudgment {}

export interface 
```
</details>

#### `L15Response` `[exported]`

```typescript
export interface L15Response extends TaskJudgment {}
```

<details>
<summary>Show code</summary>

```typescript
export interface L15Response extends TaskJudgment {}

export interface L2Request {
  existingMmd: string | null;
  newEntries: Array<{
    tool_call_id: string;
    tool_call: string;
    summary: string;
    timestamp: string;
  }>;
  recentHistory: string | null;
  currentTurn: string | null;
  taskLabel: string;
  mmdPrefix: string;
  mmdCharCount: number;
}

export interface L2Response {
  fileAction: "write" | "replace";
  mmdContent?: string;
  replaceBlocks?: Array<{
    startLine: number
```
</details>

#### `L2Request` `[exported]`

```typescript
export interface L2Request {
```

<details>
<summary>Show code</summary>

```typescript
export interface L2Request {
  existingMmd: string | null;
  newEntries: Array<{
    tool_call_id: string;
    tool_call: string;
    summary: string;
    timestamp: string;
  }>;
  recentHistory: string | null;
  currentTurn: string | null;
  taskLabel: string;
  mmdPrefix: string;
  mmdCharCount: number;
}

export interface L2Response {
  fileAction: "write" | "replace";
  mmdContent?: string;
  replaceBlocks?: Array<{
    startLine: number;
    endLine: number;
    content: string;
  }>;
  no
```
</details>

#### `L2Response` `[exported]`

```typescript
export interface L2Response {
```

<details>
<summary>Show code</summary>

```typescript
export interface L2Response {
  fileAction: "write" | "replace";
  mmdContent?: string;
  replaceBlocks?: Array<{
    startLine: number;
    endLine: number;
    content: string;
  }>;
  nodeMapping: Record<string, string>;
}

export interface L4Request {
  mmdFilename: string;
  mmdContent: string;
  offloadEntries: OffloadEntry[];
  skillFocus: string | null;
}

export interface L4Response {
  skillName: string;
  skillDescription: string;
  skillContent: string;
}

/**
 * Arbitrary key/value 
```
</details>

#### `L4Request` `[exported]`

```typescript
export interface L4Request {
```

<details>
<summary>Show code</summary>

```typescript
export interface L4Request {
  mmdFilename: string;
  mmdContent: string;
  offloadEntries: OffloadEntry[];
  skillFocus: string | null;
}

export interface L4Response {
  skillName: string;
  skillDescription: string;
  skillContent: string;
}

/**
 * Arbitrary key/value payload uploaded to the backend `/offload/v1/store` endpoint.
 * The backend stores the raw JSON body verbatim; see `internal/handler/store.go`.
 */
export type StoreStatePayload = Record<string, unknown>;

export interface Sto
```
</details>

#### `L4Response` `[exported]`

```typescript
export interface L4Response {
```

<details>
<summary>Show code</summary>

```typescript
export interface L4Response {
  skillName: string;
  skillDescription: string;
  skillContent: string;
}

/**
 * Arbitrary key/value payload uploaded to the backend `/offload/v1/store` endpoint.
 * The backend stores the raw JSON body verbatim; see `internal/handler/store.go`.
 */
export type StoreStatePayload = Record<string, unknown>;

export interface StoreStateResponse {
  insertedId?: string;
}

// ─── BackendClient ───────────────────────────────────────────────────────────

export class B
```
</details>

#### `StoreStateResponse` `[exported]`

> The backend stores the raw JSON body verbatim; see `internal/handler/store.go`.

```typescript
export interface StoreStateResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface StoreStateResponse {
  insertedId?: string;
}

// ─── BackendClient ───────────────────────────────────────────────────────────

export class BackendClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  /** Hardcoded timeout for all backend calls (L1/L1.5/L2/L4) */
  private static readonly TIMEOUT_MS = 120_000;
  private logger: PluginLogger;
  private sessionKeyFn: () => string | null;
  /** Resolves the value of the `X-User-Id` header sent on every call.
```
</details>

#### `ContextSnapshot` `[exported]`

```typescript
export interface ContextSnapshot {
```

<details>
<summary>Show code</summary>

```typescript
export interface ContextSnapshot {
  timestamp: string;
  stage: string;
  encoding: string;
  totalTokens: number;
  systemTokens: number;
  messagesTokens: number;
  userPromptTokens: number;
  messageCount: number;
}

// Internal metadata keys that should NOT be counted as tokens.
// These are plugin-internal markers that the LLM never sees.
const INTERNAL_KEYS = new Set([
  "_offloaded",
  "_mmdContextMessage",
  "_mmdInjection",
  "_contextOffloadProcessed",
]);

/** JSON replacer that stri
```
</details>

#### `LocalLlmClientConfig` `[exported]`

```typescript
export interface LocalLlmClientConfig {
```

<details>
<summary>Show code</summary>

```typescript
export interface LocalLlmClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature?: number;
  timeoutMs?: number;
}

export class LocalLlmClient {
  private config: LlmCallerConfig;
  private logger?: PluginLogger;

  constructor(cfg: LocalLlmClientConfig, logger?: PluginLogger) {
    this.config = {
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      model: cfg.model,
      temperature: cfg.temperature ?? 0.2,
      timeoutMs: cfg.timeoutMs ?? 120_000,
    };
 
```
</details>

#### `LlmCallerConfig` `[exported]`

```typescript
export interface LlmCallerConfig {
```

<details>
<summary>Show code</summary>

```typescript
export interface LlmCallerConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  timeoutMs: number;
}

export interface CallLlmOpts {
  systemPrompt: string;
  userPrompt: string;
  /** Override temperature for this call */
  temperature?: number;
  /** Override timeout for this call */
  timeoutMs?: number;
  /** Label for logging (e.g. "L1", "L1.5", "L2") */
  label?: string;
}

/**
 * Call LLM with the given prompts and return the text response.
 * Throws on t
```
</details>

#### `CallLlmOpts` `[exported]`

```typescript
export interface CallLlmOpts {
```

<details>
<summary>Show code</summary>

```typescript
export interface CallLlmOpts {
  systemPrompt: string;
  userPrompt: string;
  /** Override temperature for this call */
  temperature?: number;
  /** Override timeout for this call */
  timeoutMs?: number;
  /** Label for logging (e.g. "L1", "L1.5", "L2") */
  label?: string;
}

/**
 * Call LLM with the given prompts and return the text response.
 * Throws on timeout or API errors.
 */
export async function callLlm(
  config: LlmCallerConfig,
  opts: CallLlmOpts,
  logger?: PluginLogger,
): Pro
```
</details>

#### `RawL1Entry` 

> L1 Response Parser — extracts summarization results from LLM output.

```typescript
interface RawL1Entry {
```

<details>
<summary>Show code</summary>

```typescript
interface RawL1Entry {
  tool_call?: string;
  summary?: string;
  tool_call_id?: string;
  timestamp?: string;
  score?: number;
}

/**
 * Parse L1 LLM response into OffloadEntry array.
 * Tolerant of markdown wrapping, missing fields, etc.
 */
export function parseL1Response(raw: string): OffloadEntry[] {
  const parsed = extractJson<RawL1Entry[]>(raw);
  if (!parsed || !Array.isArray(parsed)) return [];

  const entries: OffloadEntry[] = [];
  for (const item of parsed) {
    if (!item || typ
```
</details>

#### `RawL15Response` 

> L1.5 Response Parser — extracts task judgment from LLM output.

```typescript
interface RawL15Response {
```

<details>
<summary>Show code</summary>

```typescript
interface RawL15Response {
  taskCompleted?: boolean | null;
  isContinuation?: boolean | null;
  isLongTask?: boolean | null;
  continuationMmdFile?: string | null;
  newTaskLabel?: string | null;
}

/**
 * Parse L1.5 LLM response into TaskJudgment.
 * Returns null if the response is completely unparseable or all-null (backend unavailable).
 */
export function parseL15Response(raw: string): TaskJudgment | null {
  const parsed = extractJson<RawL15Response>(raw);
  if (!parsed || typeof parsed !
```
</details>

#### `L2ParsedResponse` `[exported]`

> L2 Response Parser — extracts MMD generation results from LLM output.

```typescript
export interface L2ParsedResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface L2ParsedResponse {
  fileAction: "write" | "replace";
  mmdContent?: string;
  replaceBlocks?: Array<{
    startLine: number;
    endLine: number;
    content: string;
  }>;
  nodeMapping: Record<string, string>;
}

interface RawL2Response {
  file_action?: string;
  mmd_content?: string | null;
  replace_blocks?: Array<{
    start_line?: number | string;
    end_line?: number | string;
    content?: string;
  }> | null;
  node_mapping?: Record<string, string>;
}

/**
 * Parse L
```
</details>

#### `RawL2Response` 

```typescript
interface RawL2Response {
```

<details>
<summary>Show code</summary>

```typescript
interface RawL2Response {
  file_action?: string;
  mmd_content?: string | null;
  replace_blocks?: Array<{
    start_line?: number | string;
    end_line?: number | string;
    content?: string;
  }> | null;
  node_mapping?: Record<string, string>;
}

/**
 * Parse L2 LLM response into structured L2 result.
 * Returns null if parsing fails completely.
 */
export function parseL2Response(raw: string): L2ParsedResponse | null {
  const parsed = extractJson<RawL2Response>(raw);
  if (!parsed || typ
```
</details>

#### `L1ToolPair` `[exported]`

```typescript
export interface L1ToolPair {
```

<details>
<summary>Show code</summary>

```typescript
export interface L1ToolPair {
  toolName: string;
  toolCallId: string;
  params: unknown;
  result: unknown;
  timestamp: string;
}

// ─── User Prompt Builder ─────────────────────────────────────────────────────

/**
 * Build the L1 user prompt for summarization.
 * Mirrors context-offload-server/internal/service/prompt/BuildL1UserPrompt.
 */
export function buildL1UserPrompt(recentMessages: string, pairs: L1ToolPair[]): string {
  const parts: string[] = [];

  parts.push("## 最近的对话上下文（用于理解当前
```
</details>

#### `L15CurrentMmd` `[exported]`

```typescript
export interface L15CurrentMmd {
```

<details>
<summary>Show code</summary>

```typescript
export interface L15CurrentMmd {
  filename: string;
  content: string;
  path: string;
}

export interface L15MmdMeta {
  filename: string;
  path: string;
  taskGoal: string;
  doneCount: number;
  doingCount: number;
  todoCount: number;
  updatedTime?: string | null;
  nodeSummaries?: Array<{ nodeId: string; status: string; summary: string }>;
}

// ─── User Prompt Builder ─────────────────────────────────────────────────────

/**
 * Build the L1.5 user prompt for task judgment.
 * Mirrors c
```
</details>

#### `L15MmdMeta` `[exported]`

```typescript
export interface L15MmdMeta {
```

<details>
<summary>Show code</summary>

```typescript
export interface L15MmdMeta {
  filename: string;
  path: string;
  taskGoal: string;
  doneCount: number;
  doingCount: number;
  todoCount: number;
  updatedTime?: string | null;
  nodeSummaries?: Array<{ nodeId: string; status: string; summary: string }>;
}

// ─── User Prompt Builder ─────────────────────────────────────────────────────

/**
 * Build the L1.5 user prompt for task judgment.
 * Mirrors context-offload-server/internal/service/prompt/BuildL15UserPrompt.
 */
export function build
```
</details>

### Types

#### `StoreStatePayload` `[exported]`

> The backend stores the raw JSON body verbatim; see `internal/handler/store.go`.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export type StoreStatePayload = Record<string, unknown>;

export interface StoreStateResponse {
  insertedId?: string;
}

// ─── BackendClient ───────────────────────────────────────────────────────────

export class BackendClient {
  private baseUrl: string;
  private apiKey: string | undefined;
  /** Hardcoded timeout for all backend calls (L1/L1.5/L2/L4) */
  private static readonly TIMEOUT_MS = 120_000;
  private logger: PluginLogger;
  private sessionKeyFn: () => string | null;
  /** Resolv
```
</details>

#### `L3TriggerStage` `[exported]`

> L3 trigger site — matches the three places that invoke L3 compression.

```typescript
/** L3 trigger site — matches the three places that invoke L3 compression. */
```

<details>
<summary>Show code</summary>

```typescript
export type L3TriggerStage = "after_tool_call" | "llm_input" | "assemble";

/**
 * Patch-effectiveness signal derived from the after_tool_call event.
 *
 * The upstream runtime patch is expected to attach the current `messages`
 * array to the event object. When the patch is missing, `event.messages`
 * is undefined and L3 cannot inspect or mutate the conversation.
 */
export type PatchEffective = "effective" | "missing_field" | "empty_messages" | "n/a";

/** Inspects `event.messages` to classif
```
</details>

#### `PatchEffective` `[exported]`

> is undefined and L3 cannot inspect or mutate the conversation.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export type PatchEffective = "effective" | "missing_field" | "empty_messages" | "n/a";

/** Inspects `event.messages` to classify patch health for after_tool_call. */
export function classifyPatchEffectiveness(
  event: unknown,
  stage: L3TriggerStage,
): { status: PatchEffective; messagesLen: number } {
  // Only after_tool_call depends on the runtime patch for event.messages.
  if (stage !== "after_tool_call") return { status: "n/a", messagesLen: 0 };
  if (!event || typeof event !== "object"
```
</details>

### Functions

#### `configureTokenTracker` `[exported]`

> If the encoding changes, the cached encoder is invalidated.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function configureTokenTracker(encodingName?: string): void {
  if (encodingName && encodingName !== ENCODING_NAME) {
    ENCODING_NAME = encodingName;
    encoder = null; // invalidate cached encoder
  }
}

function getEncoder(): Tiktoken {
  if (!encoder) {
    encoder = getEncoding(ENCODING_NAME as any);
  }
  return encoder;
}

/** Count tokens for a text string using tiktoken BPE encoding. */
export function tiktokenCount(text: string): number {
  if (!text || text.length === 0) retu
```
</details>

#### `tiktokenCount` `[exported]`

> Count tokens for a text string using tiktoken BPE encoding.

```typescript
/** Count tokens for a text string using tiktoken BPE encoding. */
```

<details>
<summary>Show code</summary>

```typescript
export function tiktokenCount(text: string): number {
  if (!text || text.length === 0) return 0;
  try {
    return getEncoder().encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

function extractLastUserText(messages: any[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const wrapped = m.type === "message" ? m.message : m;
    if (!wrapped || wrapped.role !== "user") continue;
    const c = wrapped.content;
    if
```
</details>

#### `jsonReplacer` `[exported]`

> JSON replacer that strips internal metadata keys from serialization.

```typescript
/** JSON replacer that strips internal metadata keys from serialization. */
```

<details>
<summary>Show code</summary>

```typescript
export function jsonReplacer(key: string, value: unknown): unknown {
  if (INTERNAL_KEYS.has(key)) return undefined;
  return value;
}

// ─── Per-message token cache (WeakMap) ─────────────────────────────────────
// Cache token counts per message object. Entries are automatically GC'd when
// the message object is no longer referenced. Cache invalidation is triggered
// by _offloaded flag changes or explicit invalidateTokenCache() calls.
const msgTokenCache = new WeakMap<object, { tokens: numb
```
</details>

#### `invalidateTokenCache` `[exported]`

> (e.g. by replaceWithSummary). Must be called after any content mutation.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function invalidateTokenCache(msg: any): void {
  msgTokenCache.delete(msg);
}

/**
 * Tiktoken-only snapshot (messages JSON + optional user prompt dedupe).
 * Does not write logs.
 * Internal metadata keys (_offloaded, _mmdContextMessage, etc.) are stripped
 * before serialization so they don't inflate the token count.
 *
 * Uses per-message WeakMap cache: unchanged messages (same object reference
 * and same _offloaded flag) reuse previously computed token counts.
 */
export function bu
```
</details>

#### `buildTiktokenContextSnapshot` `[exported]`

> and same _offloaded flag) reuse previously computed token counts.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function buildTiktokenContextSnapshot(
  stage: string,
  messages: any[],
  systemPromptText: string | null,
  userPromptText: string | null,
  precomputed?: { systemTokens?: number; userPromptTokens?: number },
): ContextSnapshot {
  const systemTokens =
    precomputed?.systemTokens != null
      ? precomputed.systemTokens
      : tiktokenCount(systemPromptText ?? "");

  // Per-message cached token counting (replaces full JSON.stringify + tiktoken)
  let messagesTokens = 0;
  for (con
```
</details>

#### `createAfterToolCallHandler` `[exported]`

```typescript
export function createAfterToolCallHandler(
```

<details>
<summary>Show code</summary>

```typescript
export function createAfterToolCallHandler(
  stateManager: OffloadStateManager,
  logger: PluginLogger,
  getContextWindow: (() => number) | undefined,
  pluginConfig: Partial<PluginConfig> | undefined,
  backendClient?: BackendClient | null,
) {
  return async (event: any, ctx: any) => {
    // Skip internal memory-pipeline sessions
    const _sk = stateManager.getLastSessionKey() ?? ctx?.sessionKey;
    if (typeof _sk === "string" && /memory-.*-session-\d+/.test(_sk)) return;

    // Count ev
```
</details>

#### `normalizeJudgment` `[exported]`

> Handles null/undefined values from backend fallback responses.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function normalizeJudgment(raw: Record<string, unknown>): TaskJudgment | null {
  // All-null response from backend means "LLM unavailable" — treat as no judgment
  if (raw.taskCompleted == null && raw.isContinuation == null && raw.isLongTask == null) {
    return null;
  }
  return {
    taskCompleted: Boolean(raw.taskCompleted),
    isContinuation: Boolean(raw.isContinuation),
    continuationMmdFile:
      typeof raw.continuationMmdFile === "string" ? raw.continuationMmdFile : undefine
```
</details>

#### `createBeforePromptBuildHandler` `[exported]`

```typescript
export function createBeforePromptBuildHandler(
```

<details>
<summary>Show code</summary>

```typescript
export function createBeforePromptBuildHandler(
  stateManager: OffloadStateManager,
  logger: PluginLogger,
  getContextWindow: (() => number) | undefined,
  pluginConfig: Partial<PluginConfig> | undefined,
) {
  return async (event: any, _ctx: any) => {
    // Skip internal memory-pipeline sessions
    const _sk = stateManager.getLastSessionKey() ?? _ctx?.sessionKey;
    if (typeof _sk === "string" && /memory-.*-session-\d+/.test(_sk)) return;

    logger.info(`[context-offload] before_prompt_
```
</details>

#### `filterHeartbeatMessages` `[exported]`

```typescript
export function filterHeartbeatMessages(messages: any[], logger: PluginLogger | undefined): number {
```

<details>
<summary>Show code</summary>

```typescript
export function filterHeartbeatMessages(messages: any[], logger: PluginLogger | undefined): number {
  const heartbeatIds = new Set<string>();
  for (const msg of messages) {
    for (const id of collectHeartbeatToolUseIds(msg)) heartbeatIds.add(id);
  }
  if (heartbeatIds.size === 0) return 0;
  let removed = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const role = getMessageRoleLocal(msg);
    if (role === "toolResult" || role === "tool") {
      cons
```
</details>

#### `isTokenOverflowError` `[exported]`

```typescript
export function isTokenOverflowError(err: any): boolean {
```

<details>
<summary>Show code</summary>

```typescript
export function isTokenOverflowError(err: any): boolean {
  const msg = String(err?.message ?? err ?? "").toLowerCase();
  return (
    msg.includes("context_length") || msg.includes("context length") ||
    (msg.includes("token") && (msg.includes("exceed") || msg.includes("limit") || msg.includes("overflow") || msg.includes("too long"))) ||
    msg.includes("prompt is too long") || msg.includes("max_tokens") ||
    msg.includes("request too large") || msg.includes("compaction") ||
    msg.inclu
```
</details>

#### `dumpMessagesSnapshot` `[exported]`

```typescript
export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
```

<details>
<summary>Show code</summary>

```typescript
export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
  const summary: string[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role ?? msg.message?.role ?? msg.type ?? "?";
    const flags: string[] = [];
    if (msg._mmdContextMessage) flags.push(`mmdCtx=${msg._mmdContextMessage}`);
    if (msg._mmdInjection) flags.push("mmdInj");
    if (msg._offloaded) flags.push("offloaded");
    const content
```
</details>

#### `createLlmInputL3Handler` `[exported]`

```typescript
export function createLlmInputL3Handler(
```

<details>
<summary>Show code</summary>

```typescript
export function createLlmInputL3Handler(
  stateManager: OffloadStateManager,
  logger: PluginLogger,
  getContextWindow: () => number,
  pluginConfig: Partial<PluginConfig> | undefined,
  callbacks?: { notifyL2NewNullEntries?: (count: number) => void },
  backendClient?: BackendClient | null,
) {
  return async (event: any) => {
    const _l3Start = Date.now();
    // Skip internal memory-pipeline sessions
    const _sk = stateManager.getLastSessionKey();
    if (typeof _sk === "string" && /mem
```
</details>

#### `compressByScoreCascade` `[exported]`

```typescript
export function compressByScoreCascade(
```

<details>
<summary>Show code</summary>

```typescript
export function compressByScoreCascade(
  messages: any[],
  offloadMap: Map<string, OffloadEntry>,
  currentTaskNodeIds: Set<string>,
  scanRatio: number,
  logger: PluginLogger,
  minCount = MILD_CASCADE_MIN_COUNT,
  initialScore = MILD_CASCADE_INITIAL_SCORE,
): { replacedCount: number; lastOffloadedId: string | null; finalThreshold: number; replacedToolCallIds: string[]; replacedDetails: Array<{ toolCallId: string; score: number; summaryPreview: string; originalLength?: number; summaryLength?
```
</details>

#### `emergencyCompress` `[exported]`

```typescript
export function emergencyCompress(
```

<details>
<summary>Show code</summary>

```typescript
export function emergencyCompress(
  messages: any[],
  targetTokens: number,
  countTokens: (t: string) => number,
  sysPrompt: string | null,
  promptText: string | null,
  logger: PluginLogger,
): { deletedCount: number; deletedToolCallIds: string[]; remainingTokens: number } {
  const mmdMsgs: { msg: any }[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]._mmdContextMessage || messages[i]._mmdInjection) {
      mmdMsgs.unshift({ msg: messages.splice(i, 1)[0] });

```
</details>

#### `removeExistingMmdInjections` `[exported]`

```typescript
export function removeExistingMmdInjections(messages: any[]): number {
```

<details>
<summary>Show code</summary>

```typescript
export function removeExistingMmdInjections(messages: any[]): number {
  let removed = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]._mmdInjection) { messages.splice(i, 1); removed++; }
  }
  return removed;
}

export async function buildHistoryMmdInjection(
  deletedToolCallIds: string[],
  offloadMap: Map<string, OffloadEntry>,
  offloadEntries: OffloadEntry[],
  stateManager: OffloadStateManager,
  logger: PluginLogger,
  countTokens: (t: string) => number,
  conte
```
</details>

#### `shouldForceL1` `[exported]`

> pending count exceeds threshold).

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function shouldForceL1(
  stateManager: OffloadStateManager,
  pluginConfig: Partial<PluginConfig> | undefined,
): boolean {
  const threshold =
    pluginConfig?.forceTriggerThreshold ?? DEFAULT_FORCE_TRIGGER_THRESHOLD;
  return stateManager.getPendingCount() >= threshold;
}
```
</details>

#### `registerOffload` `[exported]`

```typescript
export function registerOffload(api: any, offloadConfig: OffloadConfig): void {
```

<details>
<summary>Show code</summary>

```typescript
export function registerOffload(api: any, offloadConfig: OffloadConfig): void {
  const logger: PluginLogger = api.logger;

  // ── Diagnostic: detect whether api.on / api.registerHook is functional ──
  const regMode = api.registrationMode ?? "(not exposed)";
  const hasRegisterHook = typeof api.registerHook === "function";
  const hasOn = typeof api.on === "function";
  const hasRegisterContextEngine = typeof api.registerContextEngine === "function";
  const onFnName = api.on?.name ?? "(unname
```
</details>

#### `normalizeToolCallIdForLookup` `[exported]`

> in offload.jsonl while the live session uses `toolubdrk01...`. Normalize for lookup.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function normalizeToolCallIdForLookup(id: string): string {
  return id.replace(/_/g, "");
}

export function getOffloadEntry(
  map: Map<string, OffloadEntry>,
  toolCallId: string,
): OffloadEntry | undefined {
  return (
    map.get(toolCallId) ?? map.get(normalizeToolCallIdForLookup(toolCallId))
  );
}

/** Index offload entries by canonical id and by underscore-free form when they differ. */
export function populateOffloadLookupMap(
  map: Map<string, OffloadEntry>,
  entries: Offloa
```
</details>

#### `getOffloadEntry` `[exported]`

```typescript
export function getOffloadEntry(
```

<details>
<summary>Show code</summary>

```typescript
export function getOffloadEntry(
  map: Map<string, OffloadEntry>,
  toolCallId: string,
): OffloadEntry | undefined {
  return (
    map.get(toolCallId) ?? map.get(normalizeToolCallIdForLookup(toolCallId))
  );
}

/** Index offload entries by canonical id and by underscore-free form when they differ. */
export function populateOffloadLookupMap(
  map: Map<string, OffloadEntry>,
  entries: OffloadEntry[],
): void {
  for (const entry of entries) {
    map.set(entry.tool_call_id, entry);
    cons
```
</details>

#### `populateOffloadLookupMap` `[exported]`

> Index offload entries by canonical id and by underscore-free form when they differ.

```typescript
/** Index offload entries by canonical id and by underscore-free form when they differ. */
```

<details>
<summary>Show code</summary>

```typescript
export function populateOffloadLookupMap(
  map: Map<string, OffloadEntry>,
  entries: OffloadEntry[],
): void {
  for (const entry of entries) {
    map.set(entry.tool_call_id, entry);
    const alt = normalizeToolCallIdForLookup(entry.tool_call_id);
    if (alt !== entry.tool_call_id && !map.has(alt)) {
      map.set(alt, entry);
    }
  }
}

/** Check if a message is a tool result */
export function isToolResultMessage(msg: any): boolean {
  if (msg.type === "message") {
    const message = m
```
</details>

### Consts

#### `MILD_CASCADE_MIN_COUNT` `[exported]`

```typescript
export const MILD_CASCADE_MIN_COUNT = 10;
```

<details>
<summary>Show code</summary>

```typescript
export const MILD_CASCADE_MIN_COUNT = 10;
export const MILD_CASCADE_INITIAL_SCORE = 7;
export const MILD_CASCADE_FLOOR_SCORE = 1;
export const AGGRESSIVE_MIN_MESSAGES_TO_KEEP = 2;
export const EMERGENCY_MIN_MESSAGES_TO_KEEP = 4;

// ─── Message dump helper ─────────────────────────────────────────────────────

export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
  const summary: string[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m
```
</details>

#### `MILD_CASCADE_INITIAL_SCORE` `[exported]`

```typescript
export const MILD_CASCADE_INITIAL_SCORE = 7;
```

<details>
<summary>Show code</summary>

```typescript
export const MILD_CASCADE_INITIAL_SCORE = 7;
export const MILD_CASCADE_FLOOR_SCORE = 1;
export const AGGRESSIVE_MIN_MESSAGES_TO_KEEP = 2;
export const EMERGENCY_MIN_MESSAGES_TO_KEEP = 4;

// ─── Message dump helper ─────────────────────────────────────────────────────

export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
  const summary: string[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.rol
```
</details>

#### `MILD_CASCADE_FLOOR_SCORE` `[exported]`

```typescript
export const MILD_CASCADE_FLOOR_SCORE = 1;
```

<details>
<summary>Show code</summary>

```typescript
export const MILD_CASCADE_FLOOR_SCORE = 1;
export const AGGRESSIVE_MIN_MESSAGES_TO_KEEP = 2;
export const EMERGENCY_MIN_MESSAGES_TO_KEEP = 4;

// ─── Message dump helper ─────────────────────────────────────────────────────

export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
  const summary: string[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role ?? msg.message?.role ?? msg.type ?? "?";
  
```
</details>

#### `AGGRESSIVE_MIN_MESSAGES_TO_KEEP` `[exported]`

```typescript
export const AGGRESSIVE_MIN_MESSAGES_TO_KEEP = 2;
```

<details>
<summary>Show code</summary>

```typescript
export const AGGRESSIVE_MIN_MESSAGES_TO_KEEP = 2;
export const EMERGENCY_MIN_MESSAGES_TO_KEEP = 4;

// ─── Message dump helper ─────────────────────────────────────────────────────

export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
  const summary: string[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role ?? msg.message?.role ?? msg.type ?? "?";
    const flags: string[] = [];
    if (msg._
```
</details>

#### `EMERGENCY_MIN_MESSAGES_TO_KEEP` `[exported]`

```typescript
export const EMERGENCY_MIN_MESSAGES_TO_KEEP = 4;
```

<details>
<summary>Show code</summary>

```typescript
export const EMERGENCY_MIN_MESSAGES_TO_KEEP = 4;

// ─── Message dump helper ─────────────────────────────────────────────────────

export function dumpMessagesSnapshot(label: string, messages: any[], logger: PluginLogger): void {
  const summary: string[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role ?? msg.message?.role ?? msg.type ?? "?";
    const flags: string[] = [];
    if (msg._mmdContextMessage) flags.push(`mmdCtx=${msg._mmdCo
```
</details>

#### `_testExports` `[exported]`

```typescript
export const _testExports = {
```

<details>
<summary>Show code</summary>

```typescript
export const _testExports = {
  _isHeartbeatText,
  _extractMsgText,
  _normalizePromptForCompare,
  _extractLatestTurn,
  _extractRecentHistory,
  _buildL1RecentContext,
  _buildL15RecentContext,
  isInternalMemorySession,
  simpleHash,
  OffloadContextEngine,
};
```
</details>

#### `L1_SYSTEM_PROMPT` `[exported]`

> Converts tool call/result pairs into high-density JSON summaries.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export const L1_SYSTEM_PROMPT = `你是一个专为 AI 编码助手提供支持的"工具结果摘要器"。你的核心任务是深度理解当前的对话上下文，并将繁杂的工具调用与执行结果（一对toolcall和tool result整合成一条summary输出），提炼为高信息密度的 JSON 数组。

在生成摘要前，请务必进行以下内部思考：
1. 任务对齐：结合最近的对话记录，识别用户当前的核心目标和最新意图。若上下文存在冲突，始终以最新的用户意图为准。
2. 价值过滤：忽略工具如何工作的冗余细节，直接提取"发现了什么关键线索"、"做了什么关键动作"、"修改了什么具体内容"或"遇到了什么具体报错"。
3. 影响评估：判断该结果对当前任务的实质性影响（例如：证实了某个假设、推进了哪一步、做出了什么决策，或因为什么报错导致了阻塞）。

【输出格式要求】
你必须且只能输出一个合法的 JSON 对象数组 [{...}]，每个对象**必须**包含以下字段：
- "tool_call": 工具调用的简洁描述。处理规则如下：
  · 如果输入中该 tool pair 标记了 [NEEDS_CO
```
</details>

#### `L15_SYSTEM_PROMPT` `[exported]`

> Determines task lifecycle: completion, continuation, new task detection.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export const L15_SYSTEM_PROMPT = `你是一个面向 AI 编码助手的"任务生命周期门神"。
你的职责是交叉分析提供的三个输入源，精准研判任务状态，并输出纯 JSON 对象。

【输入数据利用指南（必须遵循的思考链路）】
1. 第一步 - 剖析 recentMessages（识别意图）：根据当前和历史对话，提取用户最新回复的核心诉求。判断是"继续排查"、"宣布完工（如：跑通了）"、"单轮闲聊问答"还是"开启全新需求"。
2. 第二步 - 对齐 currentMmd（评估当前基线）：将用户的最新意图与 currentMmd 的完整 Mermaid 内容进行比对——关注 taskGoal、各节点的 status（done/doing/todo）以及 summary。如果诉求完全超出了当前图表的范畴或目标已实现（所有节点 done 且无后续），则 taskCompleted 为 true。若仍在解决图表中的子问题（包括 doing 节点或修 bug），则为 false。(如果没有currentMmd，就只根据当前对话和历史对话来判断是否继续任务)
3. 第三步 -
```
</details>

#### `L2_SYSTEM_PROMPT` `[exported]`

> Generates/updates Mermaid flowchart diagrams from offload entries.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export const L2_SYSTEM_PROMPT = `你是一个究极实用主义的 AI 任务拓扑架构师与视觉叙事者。
你的核心逻辑是用尽量少的字符表达尽量多的信息，让LLM模型能看懂，不是为人类服务，尽量减少无用的视觉符号。任务是将底层工具调用记录，升维映射为一张高度语义化、表现力丰富且极度克制的 Mermaid (flowchart TD) 认知状态机。你要根据当前任务和意图，归纳"过去"，要思考"未来"如何用这些已有的信息（你只需要记录已有信息，不需要写下一步规划）并标记"雷区"。保持图表的高度概括性。

【高阶认知与拓扑指南（你的自主权与极简原则）】
1. 弹性聚合：你拥有决定节点拆合的完全自主权。对于连续的、意图相同的常规动作（如连续查看多个文件以了解上下文），建议合并为一个宏观节点；，但保留关键转折点或重大发现为独立节点。图表必须保持宏观和克制，绝不事无巨细地记流水账。
2. 认知墓碑 (防重蹈覆辙)：遇到彻底走不通的死胡同或引发严重报错的废弃方案，可以建立警示节点（status: blocked）（如果是价值不高的fail信息则不需要记录）。
3. 结论导向的摘要：
```
</details>

#### `MMD_MESSAGE_MARKER` `[exported]`

> Marker property on the injected message object.

```typescript
/** Marker property on the injected message object. */
```

<details>
<summary>Show code</summary>

```typescript
export const MMD_MESSAGE_MARKER = "_mmdContextMessage";

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Full inject — called from assemble / before_prompt_build (every user-message round)
 * and from llm_input (every LLM call).
 *
 * Only injects the ACTIVE MMD (determined by L1.5).
 * History MMDs are NOT injected here — they are only injected by L3 aggressive
 * compression (buildHistoryMmdInjection) after messages are deleted, as a
 * replacement for 
```
</details>

#### `L3_FIXED_PATCH_COST_TOKENS` `[exported]`

> that can be tuned as the runtime patch evolves.

```typescript
* (scanner loops, message-mutation wrappers, sentinel fields like
```

<details>
<summary>Show code</summary>

```typescript
export const L3_FIXED_PATCH_COST_TOKENS = 80;

/** L3 trigger site — matches the three places that invoke L3 compression. */
export type L3TriggerStage = "after_tool_call" | "llm_input" | "assemble";

/**
 * Patch-effectiveness signal derived from the after_tool_call event.
 *
 * The upstream runtime patch is expected to attach the current `messages`
 * array to the event object. When the patch is missing, `event.messages`
 * is undefined and L3 cannot inspect or mutate the conversation.
 */
exp
```
</details>

#### `REPORT_TYPE_L3` `[exported]`

> Stable report type tag — one line per reporting category.

```typescript
/** Stable report type tag — one line per reporting category. */
```

<details>
<summary>Show code</summary>

```typescript
export const REPORT_TYPE_L3 = "offload.l3.trigger" as const;

/** Per-L3-trigger report payload. */
export interface L3TriggerReport {
  reportType: typeof REPORT_TYPE_L3;
  reportedAt: string;
  sessionKey: string | null;
  stage: L3TriggerStage;
  triggerReason: string;
  pluginState: {
    activeMmdFile: string | null;
    l15Settled: boolean;
    pendingCount: number;
    confirmedOffloadCount: number;
    deletedOffloadCount: number;
  };
  /** Detailed accounting for THIS trigger only. */

```
</details>

#### `DEFAULT_DATA_ROOT` `[exported]`

> Default root data directory (parent of all agent subdirectories)

```typescript
/** Default root data directory (parent of all agent subdirectories) */
```

<details>
<summary>Show code</summary>

```typescript
export const DEFAULT_DATA_ROOT = join(homedir(), ".openclaw", "context-offload");

// ─── StorageContext ──────────────────────────────────────────────────────────

/** Immutable per-session storage path context. Created once per session switch. */
export interface StorageContext {
  readonly dataRoot: string;
  readonly dataDir: string;
  readonly refsDir: string;
  readonly mmdsDir: string;
  readonly offloadJsonl: string;
  readonly stateFile: string;
  readonly agentName: string;
  readonly 
```
</details>

#### `PLUGIN_DEFAULTS` `[exported]`

> Defaults for all configurable values (sourced from runtime .js)

```typescript
/** Defaults for all configurable values (sourced from runtime .js) */
```

<details>
<summary>Show code</summary>

```typescript
export const PLUGIN_DEFAULTS = {
  temperature: 0.2,
  forceTriggerThreshold: 4,
  defaultContextWindow: 200_000,
  maxPairsPerBatch: 20,
  l2NullThreshold: 4,
  l2TimeoutSeconds: 300,
  /** If L2 leaves entries in node_id="wait", retry after this many seconds */
  l2WaitRetrySeconds: 120,
  /** When true, time-based L2 only fires if some node_id=null row is newer than last L2 */
  l2TimeTriggerRequiresNewOffload: true,
  mildOffloadRatio: 0.5,
  mildOffloadScanRatio: 0.7,
  mildScoreTopRatio: 0
```
</details>

## Key Relationships

- (this file) → `./types.js#type { OffloadEntry` _(import)_
- (this file) → `./types.js#ToolPair` _(import)_
- (this file) → `./types.js#TaskJudgment` _(import)_
- (this file) → `./types.js#PluginLogger` _(import)_
- (this file) → `./opik-tracer.js#traceOffloadModelIo` _(import)_
- (this file) → `node:https#*` _(import)_
- (this file) → `node:http#*` _(import)_
- (this class) → `TaskJudgment` _(extends)_
- (this file) → `js-tiktoken#getEncoding` _(import)_
- (this file) → `js-tiktoken#type Tiktoken` _(import)_
- (this file) → `../time-utils.js#nowChinaISO` _(import)_
- (this file) → `../context-token-tracker.js#buildTiktokenContextSnapshot` _(import)_
- (this file) → `../context-token-tracker.js#type ContextSnapshot` _(import)_
- (this file) → `../opik-tracer.js#traceOffloadDecision` _(import)_
- (this file) → `../opik-tracer.js#traceMessagesSnapshot` _(import)_

## Suggested Tags

`#offload` `#llm` `#storage` `#config`
