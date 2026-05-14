/**
 * API Route — 检查 (Lint)
 *
 * POST /api/lint
 *
 * 调用 Claude Agent SDK 执行知识库质量检查。
 * 使用 SSE (Server-Sent Events) 流式返回进度和结果。
 *
 * 请求体: { filter?: string } (可选)
 * SSE 事件:
 * - progress: { content: string, tool?: string } — AI 进度
 * - result: { content: string } — 最终结果
 * - done: — 完成
 * - error: { content: string } — 错误信息
 */

import { type NextRequest } from "next/server";
import {
  createClaudeSession,
  buildLintPrompt,
  buildLintSystemPrompt,
  messageToSSE,
  serializeSSE,
  type LintRequest,
} from "@/lib/claude-sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: LintRequest = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        controller.enqueue(encoder.encode(serializeSSE({
          type: "progress",
          content: "Starting comprehensive wiki quality check...",
        })));

        const prompt = buildLintPrompt(body);

        // Create Claude session
        const session = createClaudeSession({
          maxTurns: 15,
          permissionMode: "acceptEdits",
          cwd: process.cwd(),
          mcpServers: {
            llmwiki: {
              command: "node",
              args: ["mcp-server/dist/index.js"],
            },
          },
        });

        // Stream results
        for await (const msg of session.send(prompt)) {
          const chunk = messageToSSE(msg);
          if (chunk) {
            controller.enqueue(encoder.encode(serializeSSE(chunk)));
          }
        }

        controller.enqueue(encoder.encode(serializeSSE({ type: "done" })));
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        controller.enqueue(encoder.encode(serializeSSE({
          type: "error",
          content: message,
        })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
