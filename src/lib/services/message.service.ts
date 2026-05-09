/**
 * 消息服务层
 *
 * 处理消息相关的业务逻辑：
 * - 消息 CRUD
 * - 执行记录管理
 * - 断线重连支持
 */

import { prisma } from "@/lib/prisma";

/**
 * 工具调用记录
 */
export interface ToolCallRecord {
  tool: string;
  args: Record<string, unknown>;
  result: string;
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  model?: string;
  intent?: string;
  interrupted?: boolean;
}

/**
 * 执行进度
 */
export interface ExecutionProgress {
  phase: "generating" | "tool_calling" | "interrupted";
  partialContent: string;
  toolCalls: ToolCallRecord[];
  metadata: MessageMetadata;
}

/**
 * 创建用户消息
 */
export async function createUserMessage(sessionId: string, content: string) {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: "user",
      content,
    },
  });

  return message;
}

/**
 * 创建 AI 消息
 */
export async function createAssistantMessage(
  sessionId: string,
  content: string,
  options?: {
    toolCalls?: ToolCallRecord[];
    metadata?: MessageMetadata;
  }
) {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: "assistant",
      content,
      toolCalls: options?.toolCalls?.length
        ? JSON.parse(JSON.stringify(options.toolCalls))
        : undefined,
      metadata: options?.metadata
        ? JSON.parse(JSON.stringify(options.metadata))
        : undefined,
    },
  });

  return message;
}

/**
 * 创建执行记录
 */
export async function createExecution(sessionId: string, triggerMessageId: string) {
  const execution = await prisma.chatExecution.create({
    data: {
      sessionId,
      triggerMessageId,
      status: "running",
    },
  });

  return execution;
}

/**
 * 更新执行进度（断线重连用）
 */
export async function updateExecutionProgress(
  executionId: string,
  progress: ExecutionProgress
) {
  await prisma.chatExecution.update({
    where: { id: executionId },
    data: {
      progress: JSON.parse(JSON.stringify(progress)),
    },
  });
}

/**
 * 标记执行完成
 */
export async function completeExecution(
  executionId: string,
  result: {
    messageId: string;
    content: string;
    toolCalls: ToolCallRecord[];
    metadata: MessageMetadata;
  }
) {
  await prisma.chatExecution.update({
    where: { id: executionId },
    data: {
      status: "completed",
      completedAt: new Date(),
      progress: undefined,
      result: JSON.parse(JSON.stringify(result)),
    },
  });
}

/**
 * 标记执行失败
 */
export async function failExecution(executionId: string, error: string) {
  await prisma.chatExecution.update({
    where: { id: executionId },
    data: {
      status: "failed",
      result: { error },
      completedAt: new Date(),
    },
  });
}

/**
 * 标记执行中断（客户端断开连接）
 */
export async function interruptExecution(
  executionId: string,
  progress: ExecutionProgress
) {
  await prisma.chatExecution.update({
    where: { id: executionId },
    data: {
      status: "interrupted",
      pausedAt: new Date(),
      progress: JSON.parse(JSON.stringify({
        ...progress,
        phase: "interrupted",
      })),
    },
  });
}

/**
 * 获取会话的最新执行记录
 */
export async function getLatestExecution(sessionId: string) {
  const execution = await prisma.chatExecution.findFirst({
    where: { sessionId },
    orderBy: { startedAt: "desc" },
  });

  return execution;
}

/**
 * 获取执行记录详情
 */
export async function getExecution(executionId: string) {
  const execution = await prisma.chatExecution.findUnique({
    where: { id: executionId },
  });

  return execution;
}

/**
 * 获取会话的消息列表
 */
export async function getSessionMessages(
  sessionId: string,
  options?: { limit?: number; cursor?: string }
) {
  const { limit = 50, cursor } = options || {};

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  return messages;
}
