/**
 * 上下文工程模块
 *
 * 负责构建发送给 LLM 的完整上下文，包括：
 * - XML 结构化系统提示词
 * - 用户信息和偏好
 * - 会话历史消息
 * - 当前用户输入
 *
 * 使用示例：
 *
 * ```typescript
 * import { buildContext, buildSimpleContext } from "@/lib/agent/context";
 *
 * // 完整构建（带历史）
 * const context = await buildContext({
 *   user: { userId: "123", responseStyle: "technical" },
 *   session: { sessionId: "abc", isFirstTurn: false, historyCount: 5 },
 *   currentInput: "React Fiber 是什么？",
 * });
 *
 * // 简化构建（单轮）
 * const simpleContext = buildSimpleContext("你好", { responseStyle: "friendly" });
 * ```
 */

// 类型导出
export type {
  UserContext,
  SessionContext,
  HistoryMessage,
  BuildContextOptions,
  BuiltContext,
  SystemPromptVariables,
} from "./types";

// 核心构建函数
export { buildContext, buildSimpleContext } from "./message-builder";

// 系统提示词相关
export {
  buildSystemPrompt,
  wrapUserQuery,
  buildPreferenceReminder,
} from "./system-prompt";

// 历史消息相关
export {
  loadHistoryFromDB,
  convertToLangChainMessages,
  patchIncompleteToolCalls,
  estimateMessageTokens,
} from "./history-builder";
