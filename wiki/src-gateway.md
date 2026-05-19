---
title: src/gateway
slug: src-gateway
created: '2026-05-19T03:56:46.065Z'
updated: '2026-05-19T03:56:46.065Z'
tags:
  - gateway
  - config
  - recall
  - memory
status: published
category: codebase
---
# Module: src/gateway

| Property | Value |
|----------|-------|
| Path | `src/gateway` |
| Files | 3 |
| Exported Symbols | 17 |
| Language | typescript |

## Files

- `config.ts`
- `server.ts`
- `types.ts`

## External Dependencies

- `node:fs`
- `node:http`
- `node:path`
- `node:url`
- `yaml`

## Exported API

### Classs

#### `TdaiGateway` `[exported]`

```typescript
export class TdaiGateway {
```

<details>
<summary>Show code</summary>

```typescript
export class TdaiGateway {
  private config: GatewayConfig;
  private logger: Logger;
  private core: TdaiCore;
  private server: http.Server | null = null;
  private startTime = Date.now();

  constructor(configOverrides?: Partial<GatewayConfig>) {
    this.config = loadGatewayConfig(configOverrides);
    this.logger = createConsoleLogger();

    // Create host adapter
    const adapter = new StandaloneHostAdapter({
      dataDir: this.config.data.baseDir,
      llmConfig: this.config.llm,
    
```
</details>

### Interfaces

#### `GatewayConfig` `[exported]`

```typescript
export interface GatewayConfig {
```

<details>
<summary>Show code</summary>

```typescript
export interface GatewayConfig {
  server: {
    port: number;
    host: string;
  };
  data: {
    /** Base directory for TDAI data storage. */
    baseDir: string;
  };
  llm: StandaloneLLMConfig;
  /** Parsed memory-tdai plugin config (recall, capture, extraction, pipeline, etc.). */
  memory: MemoryTdaiConfig;
}

// ============================
// Config loading
// ============================

/**
 * Load gateway config from file + environment variables.
 *
 * Resolution order for config fi
```
</details>

#### `GatewayErrorResponse` `[exported]`

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface GatewayErrorResponse {
  error: string;
  code?: string;
}

// ============================
// /health
// ============================

export interface HealthResponse {
  status: "ok" | "degraded";
  version: string;
  uptime: number;
  stores: {
    vectorStore: boolean;
    embeddingService: boolean;
  };
}

// ============================
// /recall
// ============================

export interface RecallRequest {
  query: string;
  session_key: string;
  user_id?: string;
}
```
</details>

#### `HealthResponse` `[exported]`

```typescript
export interface HealthResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface HealthResponse {
  status: "ok" | "degraded";
  version: string;
  uptime: number;
  stores: {
    vectorStore: boolean;
    embeddingService: boolean;
  };
}

// ============================
// /recall
// ============================

export interface RecallRequest {
  query: string;
  session_key: string;
  user_id?: string;
}

export interface RecallResponse {
  context: string;
  strategy?: string;
  memory_count?: number;
}

// ============================
// /capture
// ==
```
</details>

#### `RecallRequest` `[exported]`

```typescript
export interface RecallRequest {
```

<details>
<summary>Show code</summary>

```typescript
export interface RecallRequest {
  query: string;
  session_key: string;
  user_id?: string;
}

export interface RecallResponse {
  context: string;
  strategy?: string;
  memory_count?: number;
}

// ============================
// /capture
// ============================

export interface CaptureRequest {
  user_content: string;
  assistant_content: string;
  session_key: string;
  session_id?: string;
  user_id?: string;
  messages?: unknown[];
}

export interface CaptureResponse {
  l0_recor
```
</details>

#### `RecallResponse` `[exported]`

```typescript
export interface RecallResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface RecallResponse {
  context: string;
  strategy?: string;
  memory_count?: number;
}

// ============================
// /capture
// ============================

export interface CaptureRequest {
  user_content: string;
  assistant_content: string;
  session_key: string;
  session_id?: string;
  user_id?: string;
  messages?: unknown[];
}

export interface CaptureResponse {
  l0_recorded: number;
  scheduler_notified: boolean;
}

// ============================
// /search/memori
```
</details>

#### `CaptureRequest` `[exported]`

```typescript
export interface CaptureRequest {
```

<details>
<summary>Show code</summary>

```typescript
export interface CaptureRequest {
  user_content: string;
  assistant_content: string;
  session_key: string;
  session_id?: string;
  user_id?: string;
  messages?: unknown[];
}

export interface CaptureResponse {
  l0_recorded: number;
  scheduler_notified: boolean;
}

// ============================
// /search/memories
// ============================

export interface MemorySearchRequest {
  query: string;
  limit?: number;
  type?: string;
  scene?: string;
}

export interface MemorySearchRe
```
</details>

#### `CaptureResponse` `[exported]`

```typescript
export interface CaptureResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface CaptureResponse {
  l0_recorded: number;
  scheduler_notified: boolean;
}

// ============================
// /search/memories
// ============================

export interface MemorySearchRequest {
  query: string;
  limit?: number;
  type?: string;
  scene?: string;
}

export interface MemorySearchResponse {
  results: string;
  total: number;
  strategy: string;
}

// ============================
// /search/conversations
// ============================

export interface Conve
```
</details>

#### `MemorySearchRequest` `[exported]`

```typescript
export interface MemorySearchRequest {
```

<details>
<summary>Show code</summary>

```typescript
export interface MemorySearchRequest {
  query: string;
  limit?: number;
  type?: string;
  scene?: string;
}

export interface MemorySearchResponse {
  results: string;
  total: number;
  strategy: string;
}

// ============================
// /search/conversations
// ============================

export interface ConversationSearchRequest {
  query: string;
  limit?: number;
  session_key?: string;
}

export interface ConversationSearchResponse {
  results: string;
  total: number;
}

// ====
```
</details>

#### `MemorySearchResponse` `[exported]`

```typescript
export interface MemorySearchResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface MemorySearchResponse {
  results: string;
  total: number;
  strategy: string;
}

// ============================
// /search/conversations
// ============================

export interface ConversationSearchRequest {
  query: string;
  limit?: number;
  session_key?: string;
}

export interface ConversationSearchResponse {
  results: string;
  total: number;
}

// ============================
// /session/end
// ============================

export interface SessionEndRequest {
 
```
</details>

#### `ConversationSearchRequest` `[exported]`

```typescript
export interface ConversationSearchRequest {
```

<details>
<summary>Show code</summary>

```typescript
export interface ConversationSearchRequest {
  query: string;
  limit?: number;
  session_key?: string;
}

export interface ConversationSearchResponse {
  results: string;
  total: number;
}

// ============================
// /session/end
// ============================

export interface SessionEndRequest {
  session_key: string;
  user_id?: string;
}

export interface SessionEndResponse {
  flushed: boolean;
}

// ============================
// /seed
// ============================

/**
 * Re
```
</details>

#### `ConversationSearchResponse` `[exported]`

```typescript
export interface ConversationSearchResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface ConversationSearchResponse {
  results: string;
  total: number;
}

// ============================
// /session/end
// ============================

export interface SessionEndRequest {
  session_key: string;
  user_id?: string;
}

export interface SessionEndResponse {
  flushed: boolean;
}

// ============================
// /seed
// ============================

/**
 * Request body for `POST /seed`.
 *
 * Accepts the same input formats as the CLI `seed` command:
 * - Format A:
```
</details>

#### `SessionEndRequest` `[exported]`

```typescript
export interface SessionEndRequest {
```

<details>
<summary>Show code</summary>

```typescript
export interface SessionEndRequest {
  session_key: string;
  user_id?: string;
}

export interface SessionEndResponse {
  flushed: boolean;
}

// ============================
// /seed
// ============================

/**
 * Request body for `POST /seed`.
 *
 * Accepts the same input formats as the CLI `seed` command:
 * - Format A: `{ sessions: [{ sessionKey, conversations: [[...msgs]] }] }`
 * - Format B: `[{ sessionKey, conversations: [[...msgs]] }]`
 *
 * Wrapped in an envelope with optional
```
</details>

#### `SessionEndResponse` `[exported]`

```typescript
export interface SessionEndResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface SessionEndResponse {
  flushed: boolean;
}

// ============================
// /seed
// ============================

/**
 * Request body for `POST /seed`.
 *
 * Accepts the same input formats as the CLI `seed` command:
 * - Format A: `{ sessions: [{ sessionKey, conversations: [[...msgs]] }] }`
 * - Format B: `[{ sessionKey, conversations: [[...msgs]] }]`
 *
 * Wrapped in an envelope with optional control fields.
 */
export interface SeedRequest {
  /**
   * Seed input data — ei
```
</details>

#### `SeedRequest` `[exported]`

> Wrapped in an envelope with optional control fields.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export interface SeedRequest {
  /**
   * Seed input data — either Format A object or Format B array.
   * This is the same structure accepted by `openclaw memory-tdai seed --input`.
   */
  data: unknown;
  /** Fallback session key when input sessions lack one. */
  session_key?: string;
  /** Require each round to have both user and assistant messages. */
  strict_round_role?: boolean;
  /** Auto-fill missing timestamps (default: true). */
  auto_fill_timestamps?: boolean;
  /** Plugin config 
```
</details>

#### `SeedResponse` `[exported]`

> Plugin config overrides (deep-merged on top of gateway memory config).

```typescript
export interface SeedResponse {
```

<details>
<summary>Show code</summary>

```typescript
export interface SeedResponse {
  sessions_processed: number;
  rounds_processed: number;
  messages_processed: number;
  l0_recorded: number;
  duration_ms: number;
  output_dir: string;
}
```
</details>

### Functions

#### `loadGatewayConfig` `[exported]`

> 4. Pure environment-variable config (no file)

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export function loadGatewayConfig(overrides?: Partial<GatewayConfig>): GatewayConfig {
  let fileConfig: Record<string, unknown> = {};

  // Try to load config file
  const configPath = resolveConfigPath();
  if (configPath) {
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      if (configPath.endsWith(".json")) {
        fileConfig = JSON.parse(raw);
      } else {
      // Full YAML support (arbitrary nesting, anchors, lists, multi-line).
        // We still postprocess ${VA
```
</details>

## Key Relationships

- (this file) → `node:fs#fs` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `yaml#YAML` _(import)_
- (this file) → `../utils/env.js#getEnv` _(import)_
- (this file) → `../config.js#parseConfig` _(import)_
- (this file) → `../config.js#type { MemoryTdaiConfig` _(import)_
- (this file) → `../adapters/standalone/llm-runner.js#type { StandaloneLLMConfig` _(import)_
- (this file) → `node:http#http` _(import)_
- (this file) → `node:url#URL` _(import)_
- (this file) → `../core/tdai-core.js#TdaiCore` _(import)_
- (this file) → `../adapters/standalone/host-adapter.js#StandaloneHostAdapter` _(import)_
- (this file) → `./config.js#loadGatewayConfig` _(import)_
- (this file) → `./config.js#type { GatewayConfig` _(import)_
- (this file) → `../utils/pipeline-factory.js#initDataDirectories` _(import)_
- (this file) → `../utils/session-filter.js#SessionFilter` _(import)_

## Suggested Tags

`#gateway` `#config` `#recall` `#memory`
