/**
 * Lint Store — module-level singleton for cross-route persistent lint state.
 *
 * When the user switches tabs, Next.js unmounts the LintPanel component.
 * This store keeps the SSE stream and results alive so the lint agent
 * continues running and results are shown when the user navigates back.
 */

import type { LintIssue } from '@llmwiki/shared';
import type { SSEChunk } from './claude-sdk';
import type { ExecutionStatus } from '@/components/execution-log';

export interface LintState {
  status: ExecutionStatus;
  logs: string[];
  issues: LintIssue[] | null;
  aiResponse: string;
  toolCalls: string[];
}

type Listener = (state: LintState) => void;

const DEFAULT_STATE: LintState = {
  status: 'idle',
  logs: [],
  issues: null,
  aiResponse: '',
  toolCalls: [],
};

let state: LintState = { ...DEFAULT_STATE, logs: [], issues: null };
let listeners: Set<Listener> = new Set();
let abortController: AbortController | null = null;

function notify() {
  for (const fn of listeners) fn({ ...state });
}

export const lintStore = {
  getState(): LintState {
    return { ...state };
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  async run(apiClient: { lint: () => Promise<{ ok: boolean; data?: unknown }> }) {
    // Abort any previous run
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    state = { ...DEFAULT_STATE, status: 'running' };
    notify();

    try {
      // Fetch structured issues from REST API
      const lintResult = await apiClient.lint();
      if (lintResult.ok && Array.isArray(lintResult.data)) {
        state.issues = lintResult.data;
        notify();
      }

      if (abortController.signal.aborted) return;

      const response = await fetch('/api/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: abortController.signal,
      });

      if (!response.ok) {
        state.logs = [`HTTP Error: ${response.status} ${response.statusText}`];
        if (!state.issues) state.status = 'error';
        else state.status = 'done';
        notify();
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        state.logs = ['Cannot read response stream'];
        if (!state.issues) state.status = 'error';
        else state.status = 'done';
        notify();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const chunk: SSEChunk = JSON.parse(line.slice(6));
            switch (chunk.type) {
              case 'progress':
                if (chunk.tool) state.toolCalls = [...state.toolCalls, chunk.tool];
                if (chunk.content) {
                  responseText += chunk.content;
                  state.aiResponse = responseText;
                }
                state.logs = [...state.logs, chunk.content || `Tool: ${chunk.tool}`];
                notify();
                break;
              case 'result':
                state.aiResponse = chunk.content || '';
                state.logs = [...state.logs, chunk.content || ''];
                notify();
                break;
              case 'error':
                state.logs = [...state.logs, `Error: ${chunk.content}`];
                if (!state.issues) state.status = 'error';
                else state.status = 'done';
                notify();
                return;
              case 'done':
                break;
            }
          } catch {
            state.logs = [...state.logs, line.slice(6)];
            notify();
          }
        }
      }

      state.status = 'done';
      notify();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      state.logs = [...state.logs, `Error: ${err instanceof Error ? err.message : 'Network error'}`];
      state.status = 'error';
      notify();
    } finally {
      abortController = null;
    }
  },

  abort() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  },
};
