/**
 * API Route — 摄入 (Ingest)
 *
 * POST /api/ingest
 *
 * 调用 Claude Agent SDK 执行文档摄入。
 * 使用 SSE (Server-Sent Events) 流式返回进度和结果。
 *
 * 请求体: { sourcePath: string, category?: string, tags?: string[] }
 * SSE 事件:
 * - progress: { step: string, message: string } — 进度更新
 * - result: { content: string } — AI 输出
 * - done: — 完成
 * - error: { message: string } — 错误信息
 */

import { type NextRequest } from "next/server";
import {
  createClaudeSession,
  buildIngestPrompt,
  buildIngestSystemPrompt,
  messageToSSE,
  serializeSSE,
  type IngestRequest,
} from "@/lib/claude-sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: IngestRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.sourcePath) {
    return new Response(JSON.stringify({ error: "sourcePath is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Send initial progress
        const initEvent = serializeSSE({
          type: "progress",
          content: `Starting ingestion of: ${body.sourcePath}`,
        });
        controller.enqueue(encoder.encode(initEvent));

        const prompt = buildIngestPrompt(body);
        const systemPrompt = buildIngestSystemPrompt();

        // Create Claude session connected to the wiki MCP server
        const session = createClaudeSession({
          maxTurns: 30,
          permissionMode: "acceptEdits",
          cwd: process.cwd(),
          systemPrompt,
          mcpServers: {
            llmwiki: {
              command: "node",
              args: ["mcp-server/dist/index.js"],
            },
          },
        });

        // Send progress about AI processing
        const aiEvent = serializeSSE({
          type: "progress",
          content: "AI is analyzing the source and creating wiki pages...",
        });
        controller.enqueue(encoder.encode(aiEvent));

        // Stream Claude Agent SDK messages as SSE
        for await (const msg of session.send(prompt)) {
          const chunk = messageToSSE(msg);
          if (chunk) {
            controller.enqueue(encoder.encode(serializeSSE(chunk)));
          }
        }

        // Done
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
