/**
 * 消息构建器
 *
 * 组装最终发送给 LLM 的消息数组
 */

import {
  SystemMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { getStylePrompt, RESPONSE_STYLES, type ResponseStyleKey } from "@/lib/response-styles";
import {
  buildSystemPrompt,
  wrapUserQuery,
  buildPreferenceReminder,
} from "./system-prompt";
import {
  loadHistoryFromDB,
  convertToLangChainMessages,
  patchIncompleteToolCalls,
  estimateMessageTokens,
} from "./history-builder";
import type { BuildContextOptions, BuiltContext, UserContext } from "./types";

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
 * 构建完整的上下文
 *
 * 这是上下文工程的核心函数，负责：
 * 1. 构建 XML 结构化系统提示词
 * 2. 加载和转换历史消息
 * 3. 包装当前用户输入
 * 4. 处理首轮/后续轮的差异
 */
export async function buildContext(
  options: BuildContextOptions
): Promise<BuiltContext> {
  const {
    user,
    session,
    currentInput,
    historyMessages: providedHistory,
    maxHistoryMessages = 20,
  } = options;

  // 1. 加载历史消息（如果没有提供）
  const historyMessages = providedHistory ?? 
    (session.sessionId 
      ? await loadHistoryFromDB(session.sessionId, maxHistoryMessages)
      : []);

  // 判断是否是首轮对话
  const isFirstTurn = historyMessages.length === 0;

  // 2. 获取用户回答风格配置
  const responseStyle = getResponseStyleConfig(user);

  // 3. 构建系统提示词
  const systemPrompt = buildSystemPrompt({
    currentTime: getCurrentTime(),
    responseStyle,
  });

  // 4. 转换历史消息为 LangChain 格式
  let langChainHistory = convertToLangChainMessages(historyMessages);
  
  // 5. 处理不完整的 tool calls
  langChainHistory = patchIncompleteToolCalls(langChainHistory);

  // 6. 构建当前用户消息
  let currentUserMessage = "";
  
  // 后续轮添加偏好提醒
  if (!isFirstTurn && responseStyle) {
    currentUserMessage += buildPreferenceReminder(true);
  }
  
  // 包装用户查询
  currentUserMessage += wrapUserQuery(currentInput, isFirstTurn);

  // 7. 组装最终消息数组
  const messages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...langChainHistory,
    new HumanMessage(currentUserMessage),
  ];

  // 8. 估算 token 数量
  const totalTokensEstimate = estimateMessageTokens(messages);

  return {
    systemPrompt,
    messages,
    metadata: {
      isFirstTurn,
      historyCount: historyMessages.length,
      totalTokensEstimate,
    },
  };
}

/**
 * 简化版构建（不加载历史，用于单轮对话）
 *
 * 这是一个快捷方法，用于不需要多轮对话的场景
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

  return {
    systemPrompt,
    messages,
    metadata: {
      isFirstTurn: true,
      historyCount: 0,
      totalTokensEstimate: estimateMessageTokens(messages),
    },
  };
}
