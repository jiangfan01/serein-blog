/**
 * 消息历史构建器
 *
 * 从数据库读取历史消息，转换为 LangChain 消息格式
 * 支持滑动窗口和 Token 预算管理
 */

import {
  HumanMessage,
  AIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import type { HistoryMessage, SlidingWindowConfig } from "./types";

// ============================================================
// 数据库加载
// ============================================================

/**
 * 从数据库加载会话历史消息
 *
 * 使用滑动窗口策略：
 * 1. 按时间倒序取最近的消息
 * 2. 按轮数限制（一轮 = user + assistant + tools）
 * 3. 按 token 限制截断
 *
 * @param sessionId 会话 ID
 * @param config 滑动窗口配置
 * @param excludeMessageId 排除的消息 ID（避免当前 trigger message 重复）
 */
export async function loadHistoryFromDB(
  sessionId: string,
  config: Partial<SlidingWindowConfig> = {},
  excludeMessageId?: string,
  afterCreatedAt?: Date
): Promise<HistoryMessage[]> {
  const { maxRounds = 10, includeToolMessages = true } = config;

  // 多取一些消息，后续按轮数和 token 截断
  // 一轮可能包含 user + assistant + 多个 tool 消息
  const fetchLimit = maxRounds * 5;

  const dbMessages = await prisma.chatMessage.findMany({
    where: { 
      sessionId,
      // 排除指定的消息（当前 trigger message）
      ...(excludeMessageId && { id: { not: excludeMessageId } }),
      // 只取截断点之后的消息（更早的已被摘要覆盖）
      ...(afterCreatedAt && { createdAt: { gt: afterCreatedAt } }),
    },
    orderBy: { createdAt: "desc" }, // 倒序取最新的
    take: fetchLimit,
  });

  // 转换为 HistoryMessage 格式
  const historyMessages = dbMessages.map((msg) => {
    const metadata = msg.metadata as Record<string, unknown> | null;
    const isInterrupted = metadata?.interrupted === true;

    // 注意：toolCalls 在数据库中存储的格式是 { tool, args, result }
    // 我们不再将其还原为 LangChain 的 tool_calls 格式
    // 而是作为上下文信息保留在 metadata 中
    return {
      id: msg.id,
      role: msg.role as "user" | "assistant" | "tool",
      content: msg.content,
      // 不再传递 toolCalls，避免被误解为需要执行的工具调用
      // toolCalls 信息会在 metadata 中保留，用于上下文理解
      toolCalls: undefined,
      toolCallId: msg.toolCallId ?? undefined,
      toolName: msg.toolName ?? undefined,
      isIncomplete: isInterrupted,
      partialContent: isInterrupted ? msg.content : undefined,
      createdAt: msg.createdAt,
      // 保留原始的工具调用记录作为 metadata
      _rawToolCalls: msg.toolCalls as Array<{ tool: string; args: Record<string, unknown>; result: string }> | null,
    };
  });

  // 反转为时间正序
  historyMessages.reverse();

  // 按轮数截断
  return truncateByRounds(historyMessages, maxRounds, includeToolMessages);
}

/**
 * 按轮数截断消息
 *
 * 一轮的定义：从一条 user 消息开始，到下一条 user 消息之前
 * 包括：user + assistant + 可能的 tool 消息
 */
function truncateByRounds(
  messages: HistoryMessage[],
  maxRounds: number,
  includeToolMessages: boolean
): HistoryMessage[] {
  if (messages.length === 0) return [];

  // 找出所有轮的边界（每个 user 消息是一轮的开始）
  const roundStartIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") {
      roundStartIndices.push(i);
    }
  }

  if (roundStartIndices.length === 0) return [];

  // 只保留最近 maxRounds 轮
  const keepFromRound = Math.max(0, roundStartIndices.length - maxRounds);
  const startIndex = roundStartIndices[keepFromRound];

  // 截取消息
  let result = messages.slice(startIndex);

  // 如果不包含 tool 消息，过滤掉
  if (!includeToolMessages) {
    result = result.filter((m) => m.role !== "tool");
  }

  return result;
}

// ============================================================
// 会话摘要加载
// ============================================================

/**
 * 加载会话的滚动摘要 + 截断点时间
 *
 * 截断点（summarizedUpToMessageId）之前的对话已被压成摘要，
 * 加载历史时只需取截断点之后的原文，前面用摘要代替。
 */
export async function loadSessionSummary(sessionId: string): Promise<{
  summaryContent: string | null;
  cutAtCreatedAt?: Date;
}> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { summaryContent: true, summarizedUpToMessageId: true },
  });

  if (!session) return { summaryContent: null };

  let cutAtCreatedAt: Date | undefined;
  if (session.summarizedUpToMessageId) {
    const cutMsg = await prisma.chatMessage.findUnique({
      where: { id: session.summarizedUpToMessageId },
      select: { createdAt: true },
    });
    cutAtCreatedAt = cutMsg?.createdAt;
  }

  return { summaryContent: session.summaryContent, cutAtCreatedAt };
}

// ============================================================
// LangChain 消息转换
// ============================================================

/**
 * 将历史消息转换为 LangChain 消息格式
 *
 * 处理逻辑：
 * 1. user 消息 → HumanMessage
 * 2. assistant 消息 → AIMessage（纯文本，不还原 tool_calls）
 * 3. tool 消息 → 跳过（工具结果已经在 assistant 回复中体现）
 * 4. 中断的消息使用 partialContent
 *
 * 注意：我们不再还原 tool_calls，因为：
 * - 数据库存储的格式是 { tool, args, result }，不是 LangChain 格式
 * - 还原 tool_calls 会让模型误以为需要执行工具
 * - 工具调用的结果已经体现在 assistant 的回复内容中
 */
export function convertToLangChainMessages(
  historyMessages: HistoryMessage[]
): BaseMessage[] {
  const messages: BaseMessage[] = [];

  for (const msg of historyMessages) {
    // 处理中断的消息
    const content =
      msg.isIncomplete && msg.partialContent ? msg.partialContent : msg.content;

    // 跳过空内容的消息
    if (!content?.trim()) {
      continue;
    }

    switch (msg.role) {
      case "user":
        messages.push(new HumanMessage(content));
        break;

      case "assistant":
        // 简化处理：assistant 消息只保留文本内容
        // 不再还原 tool_calls，避免消息序列混乱
        messages.push(new AIMessage(content));
        break;

      case "tool":
        // 跳过 tool 消息
        // 工具调用的结果已经在 assistant 的回复中体现
        // 如果需要，可以在 assistant 消息的 metadata 中查看原始工具调用记录
        break;
    }
  }

  return messages;
}

// ============================================================
// Token 估算
// ============================================================

/**
 * 估算文本的 token 数量
 *
 * 粗略估算规则：
 * - 中文：约 1 字 = 1.5 token
 * - 英文：约 4 字符 = 1 token
 * - 混合内容取平均
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // 统计中文字符数
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  // 统计英文和其他字符数
  const otherChars = text.length - chineseChars;

  // 中文按 1.5 token/字，英文按 0.25 token/字符
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
}

/**
 * 估算消息数组的 token 数量
 */
export function estimateMessageTokens(messages: BaseMessage[]): number {
  let total = 0;

  for (const msg of messages) {
    // 消息内容
    const content =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);
    total += estimateTokens(content);

    // 角色标记（约 4 token）
    total += 4;

    // tool_calls 额外开销
    if (msg instanceof AIMessage && msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        total += estimateTokens(tc.name);
        total += estimateTokens(JSON.stringify(tc.args));
        total += 10; // 结构开销
      }
    }
  }

  return total;
}

/**
 * 按 token 预算截断消息
 *
 * 从最旧的消息开始移除，直到满足预算
 * 保证至少保留最近一轮对话
 */
export function truncateMessagesByTokens(
  messages: BaseMessage[],
  maxTokens: number
): { messages: BaseMessage[]; wasTruncated: boolean; removedCount: number } {
  const currentTokens = estimateMessageTokens(messages);

  if (currentTokens <= maxTokens) {
    return { messages, wasTruncated: false, removedCount: 0 };
  }

  // 找出所有轮的边界（每个 HumanMessage 是一轮的开始）
  const roundStartIndices: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i] instanceof HumanMessage) {
      roundStartIndices.push(i);
    }
  }

  // 至少保留最后一轮
  if (roundStartIndices.length <= 1) {
    return { messages, wasTruncated: false, removedCount: 0 };
  }

  // 从最旧的轮开始移除，直到满足预算
  let removedRounds = 0;
  let result = messages;

  for (let i = 0; i < roundStartIndices.length - 1; i++) {
    const startIndex = roundStartIndices[i + 1]; // 下一轮的开始
    result = messages.slice(startIndex);

    if (estimateMessageTokens(result) <= maxTokens) {
      removedRounds = i + 1;
      break;
    }
  }

  return {
    messages: result,
    wasTruncated: removedRounds > 0,
    removedCount: removedRounds,
  };
}
