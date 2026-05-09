/**
 * 上下文工程类型定义
 */

import type { BaseMessage } from "@langchain/core/messages";

/**
 * 用户上下文信息
 */
export interface UserContext {
  userId: string;
  email?: string;
  name?: string;
  /** 回答风格 key */
  responseStyle?: string;
  /** 回答风格提示词（从 RESPONSE_STYLES 获取） */
  stylePrompt?: string;
}

/**
 * 会话上下文信息
 */
export interface SessionContext {
  sessionId: string;
  /** 会话标题 */
  title?: string;
  /** 会话创建时间 */
  createdAt?: Date;
  /** 是否是首轮对话 */
  isFirstTurn: boolean;
  /** 历史消息数量 */
  historyCount: number;
}

/**
 * 消息历史记录（从数据库读取）
 */
export interface HistoryMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  /** 工具调用信息（assistant 消息） */
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  /** 工具调用 ID（tool 消息） */
  toolCallId?: string;
  /** 工具名称（tool 消息） */
  toolName?: string;
  /** 是否是中断的消息 */
  isIncomplete?: boolean;
  /** 中断时的部分内容 */
  partialContent?: string;
  createdAt: Date;
}

/**
 * 构建上下文的选项
 */
export interface BuildContextOptions {
  /** 用户上下文 */
  user: UserContext;
  /** 会话上下文 */
  session: SessionContext;
  /** 当前用户输入 */
  currentInput: string;
  /** 历史消息（可选，如果不传则从数据库读取） */
  historyMessages?: HistoryMessage[];
  /** 最大历史消息数量（默认 20） */
  maxHistoryMessages?: number;
}

/**
 * 构建上下文的结果
 */
export interface BuiltContext {
  /** 系统提示词 */
  systemPrompt: string;
  /** 完整的消息数组（用于发送给 LLM） */
  messages: BaseMessage[];
  /** 元数据 */
  metadata: {
    isFirstTurn: boolean;
    historyCount: number;
    totalTokensEstimate: number;
  };
}

/**
 * 系统提示词模板变量
 */
export interface SystemPromptVariables {
  /** 当前时间 */
  currentTime: string;
  /** 用户偏好的回答风格 */
  responseStyle?: {
    key: string;
    label: string;
    prompt: string;
  };
}
