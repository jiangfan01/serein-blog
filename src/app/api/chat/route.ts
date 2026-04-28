/**
 * Chat API Route
 *
 * 职责：接收 HTTP 请求 → 调用 Agent → 把 SSEEvent 序列化推给前端
 *
 * SSE 协议：
 * - data: {"type":"model_select","model":"deepseek-v4-flash","intent":"rag_query"}
 * - data: {"type":"tool_start","tool":"rag_search","args":{"query":"React hooks"}}
 * - data: {"type":"tool_end","tool":"rag_search","result":"找到 3 条相关内容..."}
 * - data: {"type":"text_delta","content":"React"}
 * - data: {"type":"text_delta","content":" hooks"}
 * - data: {"type":"text_delta","content":" 是..."}
 * - data: {"type":"done"}
 *
 * 前端按 type 字段分发处理，互不干扰。
 *
 * 环境变量：
 * - AGENT_MODE=enterprise 使用企业级版本（动态路由 + 监控）
 * - AGENT_MODE=langgraph 使用 LangGraph 版本
 * - AGENT_MODE=basic 或不设置，使用基础版 Function Calling 循环
 */
import { NextRequest } from "next/server";
// 三个版本的 Agent 实现
import { runAgent as runAgentBasic } from "@/lib/agent/agent";
import { runAgent as runAgentGraph } from "@/lib/agent/agent-graph";
import { runAgent as runAgentEnterprise } from "@/lib/agent/agent-enterprise";
import type { SSEEvent } from "@/lib/agent/types";

// 根据环境变量选择 Agent 实现
function getAgentRunner() {
  const mode = process.env.AGENT_MODE || "enterprise";
  
  switch (mode) {
    case "enterprise":
      return runAgentEnterprise;
    case "langgraph":
      return runAgentGraph;
    case "basic":
    default:
      return runAgentBasic;
  }
}

/**
 * 把 SSEEvent 编码成 SSE 格式的字节
 */
function encodeSSE(event: SSEEvent): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  try {
    const { question, sessionId } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    const runAgent = getAgentRunner();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // runAgent yield 的每个 SSEEvent 直接序列化推给前端
          for await (const event of runAgent(question, sessionId)) {
            controller.enqueue(encodeSSE(event));
          }

          // 发送结束事件
          controller.enqueue(encodeSSE({ type: "done" }));
          controller.close();
        } catch (error) {
          console.error("[Chat Route] Stream error:", error);
          controller.enqueue(
            encodeSSE({
              type: "error",
              message: "生成回答时出错",
            })
          );
          controller.enqueue(encodeSSE({ type: "done" }));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Chat Route] API error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
