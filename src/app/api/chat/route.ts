/**
 * Chat API Route
 *
 * 职责：接收 HTTP 请求 → 验证权限 → 委托 Service 处理 → 返回 SSE 流
 *
 * 业务逻辑已抽离到 Service 层，这里只做：
 * 1. 请求验证
 * 2. 参数提取
 * 3. 调用 Service
 * 4. 构建响应
 */
import { NextRequest } from "next/server";
import { verifyAuth, authError } from "@/lib/auth/middleware";
import {
  checkUserChatAccess,
  verifySessionOwnership,
  initializeChat,
  handleSSEEvent,
  finalizeChat,
  handleChatError,
  handleClientDisconnect,
  createChatContext,
  runChatAgent,
  encodeSSE,
} from "@/lib/services";
import type { SSEEvent } from "@/lib/agent/types";

export async function POST(req: NextRequest) {
  try {
    // 1. 验证身份
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    // 2. 验证权限和配额
    const accessResult = await checkUserChatAccess(auth.userId);
    if (!accessResult.allowed) {
      return Response.json(
        { error: accessResult.error },
        { status: accessResult.status || 403 }
      );
    }

    // 3. 解析请求参数
    const { question, sessionId } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return Response.json({ error: "缺少会话 ID" }, { status: 400 });
    }

    // 4. 验证会话归属
    const { valid, session } = await verifySessionOwnership(sessionId, auth.userId);
    if (!valid || !session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    // 5. 初始化聊天（创建消息和执行记录）
    const { userMessageId, executionId } = await initializeChat(
      sessionId,
      question,
      session.title
    );

    // 6. 创建聊天上下文
    const ctx = createChatContext(sessionId, executionId);

    // 7. 构建 SSE 流
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // 发送 executionId（前端用于断线重连）
          controller.enqueue(
            encodeSSE({
              type: "execution_start",
              executionId,
            } as SSEEvent)
          );

          // 运行 Agent（传递 userMessageId 避免历史重复）
          for await (const event of runChatAgent(question, sessionId, {
            userId: auth.userId,
            responseStyle: accessResult.user?.responseStyle,
            excludeMessageId: userMessageId,
          })) {
            controller.enqueue(encodeSSE(event));
            handleSSEEvent(event, ctx);
          }

          // 完成
          await finalizeChat(ctx);
          controller.close();
        } catch (err) {
          await handleChatError(executionId, err);
          controller.enqueue(
            encodeSSE({ type: "error", message: "生成回答时出错" })
          );
          controller.enqueue(encodeSSE({ type: "done" }));
          controller.close();
        }
      },

      // 客户端断开连接
      cancel: () => handleClientDisconnect(ctx),
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
