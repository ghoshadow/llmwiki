/**
 * API Route — 查询 (Query)
 *
 * POST /api/query
 *
 * 调用 Claude Agent SDK 执行知识库查询。
 * 使用 SSE (Server-Sent Events) 流式返回进度和结果。
 *
 * 请求体: { query: string }
 * SSE 事件:
 * - progress: { content: string } — AI 增量输出
 * - result: { content: string } — 最终结果
 * - done: — 完成
 * - error: { content: string } — 错误信息
 */

import { type NextRequest } from "next/server";
import {
  createClaudeSession,
  buildQueryPrompt,
  buildQuerySystemPrompt,
  messageToSSE,
  serializeSSE,
  type QueryRequest,
} from "@/lib/claude-sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: QueryRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.query || !body.query.trim()) {
    return new Response(JSON.stringify({ error: "query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Initial progress
        controller.enqueue(encoder.encode(serializeSSE({
          type: "progress",
          content: `Processing query: "${body.query}"`,
        })));

        const prompt = buildQueryPrompt(body);

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
