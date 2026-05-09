/**
 * 消息历史构建器
 *
 * 从数据库读取历史消息，转换为 LangChain 消息格式
 */

import {
  HumanMessage,
  AIMessage,
  ToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import type { HistoryMessage } from "./types";

/**
 * 从数据库加载会话历史消息
 */
export async function loadHistoryFromDB(
  sessionId: string,
  maxMessages: number = 20
): Promise<HistoryMessage[]> {
  const dbMessages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    take: maxMessages * 3, // 多取一些，因为包含 tool 消息
  });

  return dbMessages.map((msg) => {
    // 检查 metadata 中是否有 interrupted 标记
    const metadata = msg.metadata as Record<string, unknown> | null;
    const isInterrupted = metadata?.interrupted === true;
    
    return {
      id: msg.id,
      role: msg.role as "user" | "assistant" | "tool",
      content: msg.content,
      toolCalls: msg.toolCalls ? JSON.parse(JSON.stringify(msg.toolCalls)) : undefined,
      toolCallId: msg.toolCallId ?? undefined,
      toolName: msg.toolName ?? undefined,
      isIncomplete: isInterrupted,
      partialContent: isInterrupted ? msg.content : undefined,
      createdAt: msg.createdAt,
    };
  });
}

/**
 * 将历史消息转换为 LangChain 消息格式
 *
 * 处理逻辑：
 * 1. user 消息 → HumanMessage
 * 2. assistant 消息 → AIMessage（可能带 tool_calls）
 * 3. tool 消息 → ToolMessage
 * 4. 中断的消息使用 partialContent
 */
export function convertToLangChainMessages(
  historyMessages: HistoryMessage[]
): BaseMessage[] {
  const messages: BaseMessage[] = [];

  for (const msg of historyMessages) {
    // 处理中断的消息
    const content = msg.isIncomplete && msg.partialContent 
      ? msg.partialContent 
      : msg.content;

    // 跳过空内容的 assistant 消息（无效消息）
    if (msg.role === "assistant" && !content && !msg.toolCalls?.length) {
      continue;
    }

    switch (msg.role) {
      case "user":
        messages.push(new HumanMessage(content));
        break;

      case "assistant":
        // AIMessage 需要处理 tool_calls
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          messages.push(
            new AIMessage({
              content: content || "",
              tool_calls: msg.toolCalls.map((tc) => ({
                id: tc.id,
                name: tc.name,
                args: JSON.parse(tc.arguments || "{}"),
              })),
            })
          );
        } else {
          messages.push(new AIMessage(content));
        }
        break;

      case "tool":
        if (msg.toolCallId) {
          messages.push(
            new ToolMessage({
              content,
              tool_call_id: msg.toolCallId,
              name: msg.toolName,
            })
          );
        }
        break;
    }
  }

  return messages;
}

/**
 * 处理不完整的消息序列
 *
 * 如果最后一条 assistant 消息有未完成的 tool_calls，
 * 需要补充占位的 tool 响应，否则 LLM 会报错
 */
export function patchIncompleteToolCalls(
  messages: BaseMessage[]
): BaseMessage[] {
  if (messages.length === 0) return messages;

  const lastMessage = messages[messages.length - 1];

  // 检查是否是带 tool_calls 的 AIMessage
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
    const toolCallIds = new Set(lastMessage.tool_calls.map((tc) => tc.id));

    // 检查是否所有 tool_calls 都有对应的 ToolMessage
    const existingToolMessageIds = new Set(
      messages
        .filter((m) => m instanceof ToolMessage)
        .map((m) => (m as ToolMessage).tool_call_id)
    );

    // 补充缺失的 ToolMessage
    for (const tc of lastMessage.tool_calls) {
      if (tc.id && !existingToolMessageIds.has(tc.id)) {
        messages.push(
          new ToolMessage({
            content: "[工具调用被中断，无返回结果]",
            tool_call_id: tc.id,
            name: tc.name,
          })
        );
      }
    }
  }

  return messages;
}

/**
 * 估算消息的 token 数量（粗略估算）
 */
export function estimateMessageTokens(messages: BaseMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    const content = typeof msg.content === "string" 
      ? msg.content 
      : JSON.stringify(msg.content);
    // 粗略估算：中文约 1 字 = 1-2 token，英文约 4 字符 = 1 token
    // 这里用字符数 / 2 作为估算
    total += Math.ceil(content.length / 2);
  }
  return total;
}
