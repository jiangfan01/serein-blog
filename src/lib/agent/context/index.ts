/**
 * 上下文工程模块
 *
 * 负责构建发送给 LLM 的完整上下文，包括：
 * - XML 结构化系统提示词
 * - 用户信息和偏好
 * - 会话历史消息（滑动窗口）
 * - 记忆上下文（会话摘要、用户画像）
 * - 当前用户输入
 *
 * 分层上下文架构：
 * 1. System Prompt - 身份、能力、规则（固定）
 * 2. Dynamic Context - 运行时信息、用户偏好（动态）
 * 3. Memory Context - 会话摘要、用户画像（中长期）
 * 4. Conversation History - 滑动窗口（最近 N 轮）
 * 5. Current Input - 当前用户输入
 *
 * 使用示例：
 *
 * ```typescript
 * import { buildContext, buildSimpleContext } from "@/lib/agent/context";
 *
 * // 完整构建（带历史和记忆）
 * const context = await buildContext({
 *   user: { userId: "123", responseStyle: "technical" },
 *   session: { sessionId: "abc", isFirstTurn: false, historyCount: 5 },
 *   currentInput: "React Fiber 是什么？",
 *   memory: {
 *     sessionSummary: "用户之前询问了 React 基础概念...",
 *     userProfile: { techStack: ["React", "TypeScript"], skillLevel: "mid" },
 *   },
 *   slidingWindow: { maxRounds: 10, maxTokens: 8000 },
 * });
 *
 * // 简化构建（单轮）
 * const simpleContext = buildSimpleContext("你好", { responseStyle: "friendly" });
 * ```
 */

// 类型导出
export type {
  // 核心类型
  UserContext,
  SessionContext,
  HistoryMessage,
  BuildContextOptions,
  BuiltContext,
  SystemPromptVariables,
  // Token 预算
  TokenBudget,
  // 滑动窗口
  SlidingWindowConfig,
  // 记忆上下文
  MemoryContext,
  UserProfile,
} from "./types";

// 默认配置导出
export { DEFAULT_TOKEN_BUDGET, DEFAULT_SLIDING_WINDOW } from "./types";

// 核心构建函数
export { buildContext, buildSimpleContext } from "./message-builder";

// 系统提示词相关
export {
  buildSystemPrompt,
  wrapUserQuery,
  buildPreferenceReminder,
  buildSummarySection,
} from "./system-prompt";

// 历史消息相关
export {
  loadHistoryFromDB,
  convertToLangChainMessages,
  estimateTokens,
  estimateMessageTokens,
  truncateMessagesByTokens,
} from "./history-builder";
