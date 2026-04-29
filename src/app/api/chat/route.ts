/**
 * Chat API Route
 *
 * 职责：接收 HTTP 请求 → 验证权限 → 检查配额 → 持久化消息 → 调用 Agent → SSE 推送
 *
 * 权限检查：
 * 1. 验证 JWT Token
 * 2. 检查用户 canUseChat 权限
 * 3. 检查每日调用配额
 * 4. 验证 sessionId 归属
 *
 * 消息持久化：
 * 1. 发送前创建用户消息记录
 * 2. 完成后创建 AI 消息记录
 * 3. 首条消息时自动生成会话标题
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
 * 生成会话标题（截取前 50 字符）
 */
function generateTitle(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 50) {
    return trimmed;
  }
  return trimmed.slice(0, 50) + "...";
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

/**
 * 验证会话归属
 */
async function verifySessionOwnership(
  sessionId: string,
  userId: string
): Promise<{ valid: boolean; session?: { id: string; title: string | null } }> {
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  return session ? { valid: true, session } : { valid: false };
}

export async function POST(req: NextRequest) {
  try {
    // 验证权限
    const { error, status, userId } = await verifyUserAccess(req);
    if (error || !userId) {
      return Response.json({ error: error || "认证失败" }, { status: status || 401 });
    }

    const { question, sessionId } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    if (!sessionId || typeof sessionId !== "string") {
      return Response.json({ error: "缺少会话 ID" }, { status: 400 });
    }

    // 验证会话归属
    const { valid, session } = await verifySessionOwnership(sessionId, userId);
    if (!valid || !session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    // 创建用户消息记录
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: question,
      },
    });

    // 如果会话没有标题，用首条消息生成标题
    if (!session.title) {
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: generateTitle(question) },
      });
    }

    // 创建执行记录
    const execution = await prisma.chatExecution.create({
      data: {
        sessionId,
        triggerMessageId: userMessage.id,
        status: "running",
      },
    });

    // 用于收集 AI 响应
    let fullContent = "";
    let toolCalls: Array<{ tool: string; args: Record<string, unknown>; result: string }> = [];
    let metadata: { model?: string; intent?: string } = {};

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of runAgent(question, sessionId)) {
            controller.enqueue(encodeSSE(event));

            // 收集响应内容
            if (event.type === "text_delta") {
              fullContent += event.content;
            } else if (event.type === "model_select") {
              metadata = { model: event.model, intent: event.intent };
            } else if (event.type === "tool_end") {
              // 找到对应的 tool_start 记录并更新结果
              const existingCall = toolCalls.find(
                (c) => c.tool === event.tool && !c.result
              );
              if (existingCall) {
                existingCall.result = event.result;
              }
            } else if (event.type === "tool_start") {
              toolCalls.push({
                tool: event.tool,
                args: event.args,
                result: "",
              });
            }
          }

          // 保存 AI 消息
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: fullContent,
              toolCalls: toolCalls.length > 0 ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            },
          });

          // 更新执行记录为完成
          await prisma.chatExecution.update({
            where: { id: execution.id },
            data: {
              status: "completed",
              completedAt: new Date(),
            },
          });

          // 更新会话的 updatedAt
          await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });

          controller.close();
        } catch (err) {
          console.error("[Chat Route] Stream error:", err);

          // 更新执行记录为失败
          await prisma.chatExecution.update({
            where: { id: execution.id },
            data: {
              status: "failed",
              result: { error: String(err) },
              completedAt: new Date(),
            },
          });

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
