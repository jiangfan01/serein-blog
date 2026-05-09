/**
 * 聊天服务层
 *
 * 处理聊天的核心业务逻辑：
 * - 消息发送流程
 * - SSE 流处理
 * - 断线重连
 */

import { runAgent } from "@/lib/agent/agent";
import type { SSEEvent } from "@/lib/agent/types";
import {
  createUserMessage,
  createAssistantMessage,
  createExecution,
  updateExecutionProgress,
  completeExecution,
  failExecution,
  interruptExecution,
  type ToolCallRecord,
  type MessageMetadata,
} from "./message.service";
import { updateSessionTitle, touchSession } from "./session.service";
import { EXECUTION_PROGRESS_UPDATE_INTERVAL, SESSION_TITLE_TRUNCATE_LENGTH } from "@/lib/config/constants";

/**
 * 聊天请求参数
 */
export interface ChatRequest {
  sessionId: string;
  question: string;
  userId: string;
  responseStyle?: string;
}

/**
 * 聊天上下文（用于 SSE 流处理）
 */
interface ChatContext {
  sessionId: string;
  executionId: string;
  fullContent: string;
  toolCalls: ToolCallRecord[];
  metadata: MessageMetadata;
  lastProgressUpdate: number;
  isCompleted: boolean;
}

/**
 * 生成会话标题（截取前 N 字符）
 */
function generateTitle(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= SESSION_TITLE_TRUNCATE_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, SESSION_TITLE_TRUNCATE_LENGTH) + "...";
}

/**
 * 把 SSEEvent 编码成 SSE 格式的字节
 */
export function encodeSSE(event: SSEEvent): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

/**
 * 初始化聊天（创建消息和执行记录）
 */
export async function initializeChat(
  sessionId: string,
  question: string,
  sessionTitle: string | null
): Promise<{ userMessageId: string; executionId: string }> {
  // 创建用户消息
  const userMessage = await createUserMessage(sessionId, question);

  // 如果会话没有标题，用首条消息生成标题
  if (!sessionTitle) {
    await updateSessionTitle(sessionId, generateTitle(question));
  }

  // 创建执行记录
  const execution = await createExecution(sessionId, userMessage.id);

  return {
    userMessageId: userMessage.id,
    executionId: execution.id,
  };
}

/**
 * 处理 SSE 事件（收集响应、更新进度）
 */
export function handleSSEEvent(
  event: SSEEvent,
  ctx: ChatContext
): void {
  if (event.type === "text_delta") {
    ctx.fullContent += event.content;

    // 定期更新进度到数据库
    const now = Date.now();
    if (now - ctx.lastProgressUpdate > EXECUTION_PROGRESS_UPDATE_INTERVAL) {
      ctx.lastProgressUpdate = now;
      updateExecutionProgress(ctx.executionId, {
        phase: "generating",
        partialContent: ctx.fullContent,
        toolCalls: ctx.toolCalls,
        metadata: ctx.metadata,
      }).catch(console.error);
    }
  } else if (event.type === "model_select") {
    ctx.metadata = { model: event.model, intent: event.intent };
  } else if (event.type === "tool_start") {
    ctx.toolCalls.push({
      tool: event.tool,
      args: event.args,
      result: "",
    });
  } else if (event.type === "tool_end") {
    const existingCall = ctx.toolCalls.find(
      (c) => c.tool === event.tool && !c.result
    );
    if (existingCall) {
      existingCall.result = event.result;
    }
    // 工具完成时也更新进度
    updateExecutionProgress(ctx.executionId, {
      phase: "tool_calling",
      partialContent: ctx.fullContent,
      toolCalls: ctx.toolCalls,
      metadata: ctx.metadata,
    }).catch(console.error);
  }
}

/**
 * 完成聊天（保存消息、更新执行状态）
 */
export async function finalizeChat(ctx: ChatContext): Promise<void> {
  ctx.isCompleted = true;

  // 保存 AI 消息
  const assistantMessage = await createAssistantMessage(
    ctx.sessionId,
    ctx.fullContent,
    {
      toolCalls: ctx.toolCalls.length > 0 ? ctx.toolCalls : undefined,
      metadata: Object.keys(ctx.metadata).length > 0 ? ctx.metadata : undefined,
    }
  );

  // 更新执行记录为完成
  await completeExecution(ctx.executionId, {
    messageId: assistantMessage.id,
    content: ctx.fullContent,
    toolCalls: ctx.toolCalls,
    metadata: ctx.metadata,
  });

  // 更新会话的 updatedAt
  await touchSession(ctx.sessionId);
}

/**
 * 处理聊天错误
 */
export async function handleChatError(
  executionId: string,
  error: unknown
): Promise<void> {
  console.error("[Chat Service] Error:", error);
  await failExecution(executionId, String(error));
}

/**
 * 处理客户端断开连接
 */
export async function handleClientDisconnect(ctx: ChatContext): Promise<void> {
  console.log("[Chat Service] Client disconnected, execution:", ctx.executionId);

  if (!ctx.isCompleted) {
    // 标记为中断
    await interruptExecution(ctx.executionId, {
      phase: "interrupted",
      partialContent: ctx.fullContent,
      toolCalls: ctx.toolCalls,
      metadata: ctx.metadata,
    });

    // 如果有内容，保存一条不完整的消息
    if (ctx.fullContent.trim()) {
      await createAssistantMessage(ctx.sessionId, ctx.fullContent, {
        toolCalls: ctx.toolCalls.length > 0 ? ctx.toolCalls : undefined,
        metadata: { ...ctx.metadata, interrupted: true },
      });
    }

    console.log(
      "[Chat Service] Execution marked as interrupted, content length:",
      ctx.fullContent.length
    );
  }
}

/**
 * 创建聊天上下文
 */
export function createChatContext(
  sessionId: string,
  executionId: string
): ChatContext {
  return {
    sessionId,
    executionId,
    fullContent: "",
    toolCalls: [],
    metadata: {},
    lastProgressUpdate: Date.now(),
    isCompleted: false,
  };
}

/**
 * 运行 Agent 并返回事件流
 */
export function runChatAgent(
  question: string,
  sessionId: string,
  options: { userId: string; responseStyle?: string }
) {
  return runAgent(question, sessionId, {
    userId: options.userId,
    responseStyle: options.responseStyle || "default",
    loadHistory: false, // 暂时保持单轮
  });
}
