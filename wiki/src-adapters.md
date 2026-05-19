---
title: src/adapters
slug: src-adapters
created: '2026-05-19T03:56:45.929Z'
updated: '2026-05-19T03:56:45.930Z'
tags:
  - adapters
  - llm
  - config
status: published
category: codebase
---
# Module: src/adapters

| Property | Value |
|----------|-------|
| Path | `src/adapters` |
| Files | 7 |
| Exported Symbols | 11 |
| Language | typescript |

## Files

- `index.ts`
- `openclaw/host-adapter.ts`
- `openclaw/index.ts`
- `openclaw/llm-runner.ts`
- `standalone/host-adapter.ts`
- `standalone/index.ts`
- `standalone/llm-runner.ts`

## External Dependencies

- `@ai-sdk/openai`
- `ai`
- `node:fs`
- `node:path`
- `openclaw`

## Exported API

### Classs

#### `OpenClawHostAdapter` `[exported]`

```typescript
export class OpenClawHostAdapter implements HostAdapter {
```

<details>
<summary>Show code</summary>

```typescript
export class OpenClawHostAdapter implements HostAdapter {
  readonly hostType = "openclaw" as const;

  private api: OpenClawPluginApi;
  private pluginDataDir: string;
  private openclawConfig: unknown;
  private runnerFactory: OpenClawLLMRunnerFactory;

  constructor(opts: OpenClawHostAdapterOptions) {
    this.api = opts.api;
    this.pluginDataDir = opts.pluginDataDir;
    this.openclawConfig = opts.openclawConfig;

    this.runnerFactory = new OpenClawLLMRunnerFactory({
      config: opts.o
```
</details>

#### `OpenClawLLMRunner` `[exported]`

> Create via `OpenClawLLMRunnerFactory.createRunner()`.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export class OpenClawLLMRunner implements LLMRunner {
  private runner: CleanContextRunner;

  constructor(runner: CleanContextRunner) {
    this.runner = runner;
  }

  async run(params: LLMRunParams): Promise<string> {
    return this.runner.run({
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      taskId: params.taskId,
      timeoutMs: params.timeoutMs,
      maxTokens: params.maxTokens,
      workspaceDir: params.workspaceDir,
      instanceId: params.instanceId,
   
```
</details>

#### `OpenClawLLMRunnerFactory` `[exported]`

> so that callers only need to specify model + tools.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export class OpenClawLLMRunnerFactory implements LLMRunnerFactory {
  private config: unknown;
  private agentRuntime?: EmbeddedAgentRuntimeLike;
  private logger?: Logger;

  constructor(opts: OpenClawLLMRunnerFactoryOptions) {
    this.config = opts.config;
    this.agentRuntime = opts.agentRuntime;
    this.logger = opts.logger;
  }

  createRunner(opts?: LLMRunnerCreateOptions): LLMRunner {
    const enableTools = opts?.enableTools ?? false;
    const modelRef = opts?.modelRef;

    this.log
```
</details>

#### `StandaloneHostAdapter` `[exported]`

```typescript
export class StandaloneHostAdapter implements HostAdapter {
```

<details>
<summary>Show code</summary>

```typescript
export class StandaloneHostAdapter implements HostAdapter {
  readonly hostType = "standalone" as const;

  private dataDir: string;
  private logger: Logger;
  private runnerFactory: StandaloneLLMRunnerFactory;
  private defaultUserId: string;
  private platform: string;

  constructor(opts: StandaloneHostAdapterOptions) {
    this.dataDir = opts.dataDir;
    this.logger = opts.logger;
    this.defaultUserId = opts.defaultUserId ?? "default_user";
    this.platform = opts.platform ?? "gateway";
```
</details>

#### `StandaloneLLMRunner` `[exported]`

```typescript
export class StandaloneLLMRunner implements LLMRunner {
```

<details>
<summary>Show code</summary>

```typescript
export class StandaloneLLMRunner implements LLMRunner {
  private config: StandaloneLLMConfig;
  private model: string;
  private enableTools: boolean;
  private logger?: Logger;

  constructor(opts: {
    config: StandaloneLLMConfig;
    model?: string;
    enableTools?: boolean;
    logger?: Logger;
  }) {
    this.config = opts.config;
    this.model = opts.model ?? opts.config.model;
    this.enableTools = opts.enableTools ?? false;
    this.logger = opts.logger;
  }

  async run(params: LLM
```
</details>

#### `StandaloneLLMRunnerFactory` `[exported]`

> Used by the Gateway and Hermes host adapters.

```typescript
/**
```

<details>
<summary>Show code</summary>

```typescript
export class StandaloneLLMRunnerFactory implements LLMRunnerFactory {
  private config: StandaloneLLMConfig;
  private logger?: Logger;

  constructor(opts: StandaloneLLMRunnerFactoryOptions) {
    this.config = opts.config;
    this.logger = opts.logger;
  }

  createRunner(opts?: LLMRunnerCreateOptions): LLMRunner {
    const enableTools = opts?.enableTools ?? false;
    const modelRef = opts?.modelRef;

    // Parse "provider/model" → just use the model part for OpenAI-compatible API
    let 
```
</details>

### Interfaces

#### `OpenClawHostAdapterOptions` `[exported]`

```typescript
export interface OpenClawHostAdapterOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface OpenClawHostAdapterOptions {
  /** OpenClaw plugin API instance. */
  api: OpenClawPluginApi;
  /** Resolved plugin data directory (e.g. ~/.openclaw/state/memory-tdai). */
  pluginDataDir: string;
  /** Parsed OpenClaw config (for LLM model resolution). */
  openclawConfig: unknown;
}

// ============================
// OpenClawHostAdapter
// ============================

export class OpenClawHostAdapter implements HostAdapter {
  readonly hostType = "openclaw" as const;

  priv
```
</details>

#### `OpenClawLLMRunnerFactoryOptions` `[exported]`

```typescript
export interface OpenClawLLMRunnerFactoryOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface OpenClawLLMRunnerFactoryOptions {
  /** OpenClaw config object (passed to CleanContextRunner). */
  config: unknown;
  /** Preferred embedded agent runtime (host-injected). */
  agentRuntime?: EmbeddedAgentRuntimeLike;
  /** Logger for runner tracing. */
  logger?: Logger;
}

/**
 * Factory that creates OpenClawLLMRunner instances.
 *
 * Encapsulates the OpenClaw-specific dependencies (config, agentRuntime)
 * so that callers only need to specify model + tools.
 */
export class 
```
</details>

#### `StandaloneHostAdapterOptions` `[exported]`

```typescript
export interface StandaloneHostAdapterOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface StandaloneHostAdapterOptions {
  /** Base data directory for TDAI storage. */
  dataDir: string;
  /** LLM configuration for model calls. */
  llmConfig: StandaloneLLMConfig;
  /** Logger instance. */
  logger: Logger;
  /** Default user ID (can be overridden per-request). */
  defaultUserId?: string;
  /** Platform identifier. */
  platform?: string;
}

// ============================
// StandaloneHostAdapter
// ============================

export class StandaloneHostAdapter i
```
</details>

#### `StandaloneLLMConfig` `[exported]`

```typescript
export interface StandaloneLLMConfig {
```

<details>
<summary>Show code</summary>

```typescript
export interface StandaloneLLMConfig {
  /** OpenAI-compatible API base URL (e.g. "https://api.openai.com/v1"). */
  baseUrl: string;
  /** API key for authentication. */
  apiKey: string;
  /** Default model name (e.g. "gpt-4o"). */
  model: string;
  /** Default max output tokens. */
  maxTokens?: number;
  /** Request timeout in milliseconds (default: 120_000). */
  timeoutMs?: number;
}

// ============================
// Sandboxed tool execution helpers
// ============================

func
```
</details>

#### `StandaloneLLMRunnerFactoryOptions` `[exported]`

```typescript
export interface StandaloneLLMRunnerFactoryOptions {
```

<details>
<summary>Show code</summary>

```typescript
export interface StandaloneLLMRunnerFactoryOptions {
  /** LLM API configuration. */
  config: StandaloneLLMConfig;
  /** Logger instance. */
  logger?: Logger;
}

/**
 * Factory that creates StandaloneLLMRunner instances.
 *
 * Used by the Gateway and Hermes host adapters.
 */
export class StandaloneLLMRunnerFactory implements LLMRunnerFactory {
  private config: StandaloneLLMConfig;
  private logger?: Logger;

  constructor(opts: StandaloneLLMRunnerFactoryOptions) {
    this.config = opts.conf
```
</details>

## Key Relationships

- (this file) → `openclaw/plugin-sdk/core#type { OpenClawPluginApi` _(import)_
- (this file) → `./llm-runner.js#OpenClawLLMRunnerFactory` _(import)_
- (this class) → `HostAdapter` _(extends)_
- (this file) → `../../utils/clean-context-runner.js#CleanContextRunner` _(import)_
- (this file) → `../../utils/clean-context-runner.js#type { EmbeddedAgentRuntimeLike` _(import)_
- (this class) → `LLMRunner` _(extends)_
- (this class) → `LLMRunnerFactory` _(extends)_
- (this file) → `./llm-runner.js#StandaloneLLMRunnerFactory` _(import)_
- (this file) → `./llm-runner.js#type { StandaloneLLMConfig` _(import)_
- (this class) → `HostAdapter` _(extends)_
- (this file) → `node:fs/promises#fsPromises` _(import)_
- (this file) → `node:path#path` _(import)_
- (this file) → `ai#generateText` _(import)_
- (this file) → `ai#tool` _(import)_
- (this file) → `ai#stepCountIs` _(import)_

## Suggested Tags

`#adapters` `#llm` `#config`
