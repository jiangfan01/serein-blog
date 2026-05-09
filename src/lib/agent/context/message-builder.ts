/**
 * 消息构建器
 *
 * 组装最终发送给 LLM 的消息数组
 * 支持分层上下文架构和 Token 预算管理
 */

import {
  SystemMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { RESPONSE_STYLES, type ResponseStyleKey } from "@/lib/response-styles";
import {
  buildSystemPrompt,
  wrapUserQuery,
  buildPreferenceReminder,
  buildSummarySection,
} from "./system-prompt";
import {
  loadHistoryFromDB,
  convertToLangChainMessages,
  estimateTokens,
  estimateMessageTokens,
  truncateMessagesByTokens,
} from "./history-builder";
import type {
  BuildContextOptions,
  BuiltContext,
  UserContext,
  SlidingWindowConfig,
  TokenBudget,
} from "./types";

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取当前时间字符串
 */
function getCurrentTime(): string {
  return new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  });
}

/**
 * 获取用户的回答风格配置
 */
function getResponseStyleConfig(user: UserContext) {
  const styleKey = (user.responseStyle || "default") as ResponseStyleKey;
  const style = RESPONSE_STYLES[styleKey];

  if (!style || styleKey === "default") {
    return undefined;
  }

  return {
    key: style.key,
    label: style.label,
    prompt: style.prompt,
  };
}

/**
 * 合并配置（使用默认值填充缺失项）
 */
function mergeConfig<T extends object>(
  defaults: T,
  overrides?: Partial<T>
): T {
  return { ...defaults, ...overrides };
}

// 默认配置
const defaultTokenBudget: TokenBudget = {
  systemPrompt: 1500,
  dynamicContext: 500,
  memoryContext: 2000,
  conversationHistory: 8000,
  currentInput: 2000,
  reservedForOutput: 4000,
  total: 18000,
};

const defaultSlidingWindow: SlidingWindowConfig = {
  maxRounds: 10,
  maxTokens: 8000,
  includeToolMessages: true,
};

/**
 * 根据模型上下文长度动态计算 token 预算
 *
 * 分配策略：
 * - 系统提示词：固定 1500
 * - 动态上下文：固定 500
 * - 记忆上下文：固定 2000
 * - 预留输出：固定 4000
 * - 当前输入：固定 2000
 * - 历史对话：剩余空间的 80%（留 20% 余量）
 */
function calculateTokenBudget(modelContextLength?: number): TokenBudget {
  if (!modelContextLength || modelContextLength <= 0) {
    return defaultTokenBudget;
  }

  const fixedCosts = {
    systemPrompt: 1500,
    dynamicContext: 500,
    memoryContext: 2000,
    currentInput: 2000,
    reservedForOutput: 4000,
  };

  const totalFixed = Object.values(fixedCosts).reduce((a, b) => a + b, 0);
  const remaining = modelContextLength - totalFixed;

  // 历史对话预算 = 剩余空间的 80%，但不超过 32000（避免太长影响质量）
  const conversationHistory = Math.min(
    Math.max(Math.floor(remaining * 0.8), 2000), // 至少 2000
    32000 // 最多 32000
  );

  return {
    ...fixedCosts,
    conversationHistory,
    total: totalFixed + conversationHistory,
  };
}

// ============================================================
// 核心构建函数
// ============================================================

/**
 * 构建完整的上下文
 *
 * 分层上下文架构：
 * 1. System Prompt - 身份、能力、规则
 * 2. Dynamic Context - 运行时信息、用户偏好（已整合到 System Prompt）
 * 3. Memory Context - 会话摘要、用户画像
 * 4. Conversation History - 滑动窗口
 * 5. Current Input - 当前用户输入
 */
export async function buildContext(
  options: BuildContextOptions
): Promise<BuiltContext> {
  const {
    user,
    session,
    currentInput,
    historyMessages: providedHistory,
    memory,
    slidingWindow: slidingWindowOverrides,
    tokenBudget: tokenBudgetOverrides,
    excludeMessageId,
    modelContextLength,
  } = options;

  // 根据模型上下文长度动态计算 token 预算
  const baseTokenBudget = calculateTokenBudget(modelContextLength);
  const tokenBudget = mergeConfig(baseTokenBudget, tokenBudgetOverrides);

  // 合并滑动窗口配置，maxTokens 跟随 token 预算
  const slidingWindow = mergeConfig(
    {
      ...defaultSlidingWindow,
      maxTokens: tokenBudget.conversationHistory,
    },
    slidingWindowOverrides
  );

  // Token 估算记录
  const tokenEstimates = {
    systemPrompt: 0,
    dynamicContext: 0,
    memoryContext: 0,
    conversationHistory: 0,
    currentInput: 0,
    total: 0,
  };

  // 截断信息
  let wasTruncated = false;
  let truncationInfo: BuiltContext["metadata"]["truncationInfo"];

  // ===== 1. 加载历史消息 =====
  // 支持排除当前 trigger message，避免重复
  const historyMessages =
    providedHistory ??
    (session.sessionId
      ? await loadHistoryFromDB(session.sessionId, slidingWindow, excludeMessageId)
      : []);

  const isFirstTurn = historyMessages.length === 0;
  const originalRounds = countRounds(historyMessages);

  // ===== 2. 获取用户回答风格配置 =====
  const responseStyle = getResponseStyleConfig(user);

  // ===== 3. 构建系统提示词 =====
  const systemPrompt = buildSystemPrompt({
    currentTime: getCurrentTime(),
    responseStyle,
    userProfile: memory?.userProfile,
  });
  tokenEstimates.systemPrompt = estimateTokens(systemPrompt);

  // ===== 4. 构建记忆上下文（会话摘要） =====
  let memorySection = "";
  if (memory?.sessionSummary || session.summary) {
    memorySection = buildSummarySection(
      memory?.sessionSummary || session.summary || ""
    );
    tokenEstimates.memoryContext = estimateTokens(memorySection);
  }

  // ===== 5. 转换历史消息为 LangChain 格式 =====
  // 简化处理：不再还原 tool_calls，只保留纯文本对话
  const langChainHistory = convertToLangChainMessages(historyMessages);

  // ===== 6. Token 预算管理：截断历史消息 =====
  const historyTokenBudget = tokenBudget.conversationHistory;
  const truncateResult = truncateMessagesByTokens(
    langChainHistory,
    historyTokenBudget
  );

  const truncatedHistory = truncateResult.messages;
  tokenEstimates.conversationHistory = estimateMessageTokens(truncatedHistory);

  if (truncateResult.wasTruncated) {
    wasTruncated = true;
    truncationInfo = {
      originalRounds,
      keptRounds: countRounds(historyMessages) - truncateResult.removedCount,
      reason: "token_limit",
    };
  }

  // ===== 7. 构建当前用户消息 =====
  let currentUserMessage = "";

  // 注入会话摘要（如果有）
  if (memorySection) {
    currentUserMessage += memorySection;
  }

  // 后续轮添加偏好提醒
  if (!isFirstTurn && responseStyle) {
    currentUserMessage += buildPreferenceReminder(true);
  }

  // 包装用户查询
  currentUserMessage += wrapUserQuery(currentInput, isFirstTurn);
  tokenEstimates.currentInput = estimateTokens(currentUserMessage);

  // ===== 8. 组装最终消息数组 =====
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...truncatedHistory,
    new HumanMessage(currentUserMessage),
  ];

  // ===== 9. 计算总 token =====
  tokenEstimates.total =
    tokenEstimates.systemPrompt +
    tokenEstimates.memoryContext +
    tokenEstimates.conversationHistory +
    tokenEstimates.currentInput;

  return {
    systemPrompt,
    messages,
    metadata: {
      isFirstTurn,
      historyCount: historyMessages.length,
      tokenEstimates,
      wasTruncated,
      truncationInfo,
    },
  };
}

/**
 * 简化版构建（不加载历史，用于单轮对话）
 */
export function buildSimpleContext(
  currentInput: string,
  user?: Partial<UserContext>
): BuiltContext {
  const responseStyle = user?.responseStyle
    ? getResponseStyleConfig({
        userId: user.userId || "anonymous",
        responseStyle: user.responseStyle,
      })
    : undefined;

  const systemPrompt = buildSystemPrompt({
    currentTime: getCurrentTime(),
    responseStyle,
  });

  const userMessage = wrapUserQuery(currentInput, true);

  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessage),
  ];

  const systemTokens = estimateTokens(systemPrompt);
  const inputTokens = estimateTokens(userMessage);

  return {
    systemPrompt,
    messages,
    metadata: {
      isFirstTurn: true,
      historyCount: 0,
      tokenEstimates: {
        systemPrompt: systemTokens,
        dynamicContext: 0,
        memoryContext: 0,
        conversationHistory: 0,
        currentInput: inputTokens,
        total: systemTokens + inputTokens,
      },
      wasTruncated: false,
    },
  };
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 统计消息中的轮数
 */
function countRounds(
  messages: Array<{ role: string }> | BaseMessage[]
): number {
  let count = 0;
  for (const msg of messages) {
    const role = "role" in msg ? msg.role : msg._getType();
    if (role === "user" || role === "human") {
      count++;
    }
  }
  return count;
}
