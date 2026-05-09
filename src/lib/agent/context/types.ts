/**
 * 上下文工程类型定义
 *
 * 分层上下文架构：
 * 1. System Prompt - 身份、能力、规则（固定）
 * 2. Dynamic Context - 运行时信息、用户偏好（动态）
 * 3. Memory Context - 会话摘要、用户画像（中长期）
 * 4. Conversation History - 滑动窗口（最近 N 轮）
 * 5. Current Input - 当前用户输入
 */

import type { BaseMessage } from "@langchain/core/messages";

// ============================================================
// Token 预算配置
// ============================================================

/**
 * Token 预算配置
 * 用于控制各部分上下文的 token 分配
 */
export interface TokenBudget {
  /** 系统提示词预算 */
  systemPrompt: number;
  /** 动态上下文预算（时间、偏好等） */
  dynamicContext: number;
  /** 记忆上下文预算（摘要、画像） */
  memoryContext: number;
  /** 历史对话预算 */
  conversationHistory: number;
  /** 当前输入预算 */
  currentInput: number;
  /** 预留给输出的空间 */
  reservedForOutput: number;
  /** 总预算 */
  total: number;
}

/**
 * 默认 Token 预算（适用于 128K 上下文模型）
 */
export const DEFAULT_TOKEN_BUDGET: TokenBudget = {
  systemPrompt: 1500,
  dynamicContext: 500,
  memoryContext: 2000,
  conversationHistory: 8000,
  currentInput: 2000,
  reservedForOutput: 4000,
  total: 18000, // 保守估计，留足余量
};

// ============================================================
// 用户上下文
// ============================================================

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

// ============================================================
// 会话上下文
// ============================================================

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
  /** 会话摘要（如果有） */
  summary?: string;
}

// ============================================================
// 记忆上下文（中长期）
// ============================================================

/**
 * 用户画像（长期记忆）
 */
export interface UserProfile {
  /** 技术栈 */
  techStack?: string[];
  /** 技能水平 */
  skillLevel?: "junior" | "mid" | "senior";
  /** 学习目标 */
  learningGoals?: string[];
  /** 求职目标 */
  careerGoals?: {
    targetPosition?: string;
    targetCity?: string;
    expectedSalary?: string;
  };
}

/**
 * 记忆上下文
 */
export interface MemoryContext {
  /** 会话摘要（中期记忆） */
  sessionSummary?: string;
  /** 用户画像（长期记忆） */
  userProfile?: UserProfile;
}

// ============================================================
// 消息历史
// ============================================================

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

// ============================================================
// 构建选项和结果
// ============================================================

/**
 * 滑动窗口配置
 */
export interface SlidingWindowConfig {
  /** 最大消息轮数（一轮 = user + assistant） */
  maxRounds: number;
  /** 最大 token 数（超过则截断） */
  maxTokens: number;
  /** 是否保留工具调用消息 */
  includeToolMessages: boolean;
}

/**
 * 默认滑动窗口配置
 */
export const DEFAULT_SLIDING_WINDOW: SlidingWindowConfig = {
  maxRounds: 10,
  maxTokens: 8000,
  includeToolMessages: true,
};

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
  /** 记忆上下文（可选） */
  memory?: MemoryContext;
  /** 滑动窗口配置（可选） */
  slidingWindow?: Partial<SlidingWindowConfig>;
  /** Token 预算配置（可选） */
  tokenBudget?: Partial<TokenBudget>;
  /** 排除的消息 ID（用于避免当前 trigger message 重复） */
  excludeMessageId?: string;
  /** 模型上下文长度（用于动态计算 token 预算） */
  modelContextLength?: number;
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
    /** 各部分 token 估算 */
    tokenEstimates: {
      systemPrompt: number;
      dynamicContext: number;
      memoryContext: number;
      conversationHistory: number;
      currentInput: number;
      total: number;
    };
    /** 是否触发了截断 */
    wasTruncated: boolean;
    /** 截断信息 */
    truncationInfo?: {
      originalRounds: number;
      keptRounds: number;
      reason: "token_limit" | "round_limit";
    };
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
  /** 用户画像（可选，用于个性化） */
  userProfile?: UserProfile;
}
