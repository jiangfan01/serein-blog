/**
 * Chat API Route
 *
 * 职责：接收 HTTP 请求 → 验证权限 → 检查配额 → 调用 Agent → SSE 推送
 *
 * 权限检查：
 * 1. 验证 JWT Token
 * 2. 检查用户 canUseChat 权限
 * 3. 检查每日调用配额
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { runAgent } from "@/lib/agent/agent";
import type { SSEEvent } from "@/lib/agent/types";

/**
 * 把 SSEEvent 编码成 SSE 格式的字节
 */
function encodeSSE(event: SSEEvent): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * 验证用户权限和配额
 */
async function verifyUserAccess(req: NextRequest): Promise<{
  error?: string;
  status?: number;
  userId?: string;
}> {
  // 1. 验证 Token
  const token = extractToken(req.headers.get("Authorization"));
  if (!token) {
    return { error: "请先登录", status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: "登录已过期，请重新登录", status: 401 };
  }

  // 2. 查询用户
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      enabled: true,
      canUseChat: true,
      dailyLimit: true,
    },
  });

  if (!user || !user.enabled) {
    return { error: "账号不存在或已被禁用", status: 403 };
  }

  if (!user.canUseChat) {
    return { error: "您没有使用聊天功能的权限", status: 403 };
  }

  // 3. 检查每日配额
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.modelCallLog.count({
    where: {
      sessionId: { startsWith: user.id },
      createdAt: { gte: today },
    },
  });

  if (todayUsage >= user.dailyLimit) {
    return {
      error: `今日调用次数已达上限（${user.dailyLimit}次），请明天再试`,
      status: 429,
    };
  }

  return { userId: user.id };
}

export async function POST(req: NextRequest) {
  try {
    // 验证权限
    const { error, status, userId } = await verifyUserAccess(req);
    if (error) {
      return Response.json({ error }, { status });
    }

    const { question, sessionId } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    // 使用 userId 作为 sessionId 前缀，方便统计
    const fullSessionId = sessionId ? `${userId}-${sessionId}` : userId;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of runAgent(question, fullSessionId)) {
            controller.enqueue(encodeSSE(event));
          }
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
