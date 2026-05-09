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
 *
 * 断线重连：
 * - 每次 chunk 到达时更新 progress 到数据库
 * - 使用 heartbeat 机制检测连接状态
 * - 连接断开时自动标记为 interrupted
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";
import { runAgent } from "@/lib/agent/agent";
import { getStylePrompt } from "@/lib/response-styles";
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
 * 验证用户权限和配额，同时返回用户偏好
 */
async function verifyUserAccess(userId: string): Promise<{
  error?: string;
  status?: number;
  responseStyle?: string;
}> {
  // 查询用户
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      enabled: true,
      canUseChat: true,
      dailyLimit: true,
      responseStyle: true,
    },
  });

  if (!user || !user.enabled) {
    return { error: "账号不存在或已被禁用", status: 403 };
  }

  if (!user.canUseChat) {
    return { error: "您没有使用聊天功能的权限", status: 403 };
  }

  // 检查每日配额
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

  return { responseStyle: user.responseStyle };
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
    // 使用统一的 verifyAuth 中间件
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    // 验证用户权限和配额
    const { error, status, responseStyle } = await verifyUserAccess(auth.userId);
    if (error) {
      return Response.json({ error }, { status: status || 403 });
    }

    // 获取风格提示词
    const stylePrompt = getStylePrompt(responseStyle || "default");

    const userId = auth.userId;
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
    
    // 断线重连：定期更新进度到数据库
    let lastProgressUpdate = Date.now();
    const PROGRESS_UPDATE_INTERVAL = 300; // 每 300ms 更新一次（更频繁以减少数据丢失）
    
    // 标记是否正常完成
    let isCompleted = false;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // 先发送 executionId，前端用于断线重连
          controller.enqueue(encodeSSE({ 
            type: "execution_start", 
            executionId: execution.id 
          } as SSEEvent));

          for await (const event of runAgent(question, sessionId, { stylePrompt })) {
            controller.enqueue(encodeSSE(event));

            // 收集响应内容
            if (event.type === "text_delta") {
              fullContent += event.content;
              
              // 定期更新进度到数据库（断线重连用）
              const now = Date.now();
              if (now - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
                lastProgressUpdate = now;
                // 异步更新，不阻塞流
                prisma.chatExecution.update({
                  where: { id: execution.id },
                  data: {
                    progress: JSON.parse(JSON.stringify({
                      phase: "generating",
                      partialContent: fullContent,
                      toolCalls,
                      metadata,
                    })),
                  },
                }).catch(console.error);
              }
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
              // 工具完成时也更新进度
              prisma.chatExecution.update({
                where: { id: execution.id },
                data: {
                  progress: JSON.parse(JSON.stringify({
                    phase: "tool_calling",
                    partialContent: fullContent,
                    toolCalls,
                    metadata,
                  })),
                },
              }).catch(console.error);
            } else if (event.type === "tool_start") {
              toolCalls.push({
                tool: event.tool,
                args: event.args,
                result: "",
              });
            }
          }

          // 标记正常完成
          isCompleted = true;

          // 保存 AI 消息
          const assistantMessage = await prisma.chatMessage.create({
            data: {
              sessionId,
              role: "assistant",
              content: fullContent,
              toolCalls: toolCalls.length > 0 ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
              metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
            },
          });

          // 更新执行记录为完成，保存最终结果
          await prisma.chatExecution.update({
            where: { id: execution.id },
            data: {
              status: "completed",
              completedAt: new Date(),
              progress: undefined, // 清空进度
              result: JSON.parse(JSON.stringify({
                messageId: assistantMessage.id,
                content: fullContent,
                toolCalls,
                metadata,
              })),
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
      
      // 当客户端断开连接时（刷新页面、关闭标签页等）
      cancel: async () => {
        console.log("[Chat Route] Client disconnected, execution:", execution.id);
        
        // 如果还没正常完成，标记为中断
        if (!isCompleted) {
          try {
            // 保存已生成的内容为中断状态
            await prisma.chatExecution.update({
              where: { id: execution.id },
              data: {
                status: "interrupted",
                pausedAt: new Date(),
                progress: JSON.parse(JSON.stringify({
                  phase: "interrupted",
                  partialContent: fullContent,
                  toolCalls,
                  metadata,
                })),
              },
            });
            
            // 如果有内容，也保存一条不完整的 assistant 消息
            if (fullContent.trim()) {
              await prisma.chatMessage.create({
                data: {
                  sessionId,
                  role: "assistant",
                  content: fullContent,
                  toolCalls: toolCalls.length > 0 ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
                  metadata: {
                    ...metadata,
                    interrupted: true, // 标记为中断的消息
                  },
                },
              });
            }
            
            console.log("[Chat Route] Execution marked as interrupted with content length:", fullContent.length);
          } catch (err) {
            console.error("[Chat Route] Failed to mark execution as interrupted:", err);
          }
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
