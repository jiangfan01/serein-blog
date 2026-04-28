/**
 * 企业级 Agent 编排层
 *
 * 核心特性：
 * 1. 智能意图分类 - 用小模型做分类
 * 2. 动态模型路由 - 从数据库读取配置
 * 3. 自动降级 - 主模型失败切备用
 * 4. 完整监控 - 记录 token、延迟、成本
 */
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { BaseMessage, AIMessage } from "@langchain/core/messages";
import { allTools } from "./tools";
import { getIntentClassifier } from "./router/intent-classifier";
import { getModelRouter } from "./router/model-router";
import { getCallLogger } from "./router/call-logger";
import type { SSEEvent } from "./types";
import type { RouteResult, IntentType } from "./router/types";

const SYSTEM_PROMPT = String.raw`你是 Serein Blog 的 AI 助手，一个面向开发者的技术知识库工作台。你的目标不是单纯聊天，而是根据用户意图，在「直接回答」「检索博客知识库」「联网搜索」之间做出正确决策，并给出清晰、可靠、可验证的中文回答。

## 可用工具

### 1. rag_search
用于在 Serein Blog 的技术笔记知识库中进行语义检索。

### 2. web_search
用于联网搜索公开网页信息。

## 决策规则

1. 用户明确要求联网或搜索时，必须调用 web_search
2. 用户明确要求博客或笔记内容时，必须优先调用 rag_search
3. 简单闲聊、通用编程概念可以直接回答
4. 不确定时，优先判断问题是否会随时间变化；会变化就 web_search

## 回答规范

- 始终使用中文回答，技术术语可以保留英文
- 回答要结构清晰，不要堆长段落
- 代码示例使用 markdown 代码块
- 不要编造工具没有返回的信息

## 风格要求

清晰、直接、工程化、有判断、少废话、不绕弯。`;

// ============ 辅助函数 ============

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        return "";
      })
      .join("");
  }
  return "";
}

function createToolPreview(result: string): string {
  return result.length > 2000 ? `${result.slice(0, 2000)}...` : result;
}

/**
 * 创建 LLM 实例
 */
function createLLM(route: RouteResult, bindTools = false) {
  const llm = new ChatOpenAI({
    model: route.modelName,
    apiKey: process.env[route.apiKeyEnv],
    configuration: {
      baseURL: route.baseUrl,
    },
    temperature: 0,
    streaming: true,
    ...(route.extraParams && {
      modelKwargs: route.extraParams,
    }),
  });

  return bindTools ? llm.bindTools(allTools) : llm;
}

/**
 * 执行工具调用
 */
async function executeTool(
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<{ result: string; latencyMs: number }> {
  const startTime = Date.now();
  const targetTool = allTools.find((t) => t.name === toolName);

  if (!targetTool) {
    return {
      result: `未知工具: ${toolName}`,
      latencyMs: Date.now() - startTime,
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (targetTool as any).invoke(toolArgs);
    return {
      result: typeof result === "string" ? result : JSON.stringify(result),
      latencyMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      result: `工具执行失败: ${error instanceof Error ? error.message : "未知错误"}`,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * 估算 token 数（简单估算，实际应该用 tokenizer）
 */
function estimateTokens(text: string): number {
  // 中文大约 1.5 字符 = 1 token，英文大约 4 字符 = 1 token
  // 这里用简单的平均估算
  return Math.ceil(text.length / 2);
}

// ============ 主函数 ============

/**
 * 企业级 Agent 主函数
 */
export async function* runAgentEnterprise(
  question: string,
  sessionId?: string
): AsyncGenerator<SSEEvent, void, unknown> {
  const startTime = Date.now();
  const classifier = getIntentClassifier();
  const router = getModelRouter();
  const logger = getCallLogger();

  // 记录工具调用
  const toolCallRecords: Array<{ tool: string; latencyMs: number }> = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let usedFallback = false;
  let fallbackReason: string | undefined;
  let currentRoute: RouteResult | null = null;
  let intent: IntentType = "simple_chat";

  try {
    // ===== 1. 意图分类 =====
    const intentResult = await classifier.classify(question);
    intent = intentResult.intent;

    // ===== 2. 模型路由 =====
    currentRoute = await router.route({ question, intent, sessionId });

    // 通知前端：选择了哪个模型
    yield {
      type: "model_select",
      model: currentRoute.modelName,
      intent,
    };

    // 通知前端：开始思考
    yield { type: "thinking" };

    // ===== 3. 执行 Agent 循环 =====
    const messages: BaseMessage[] = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(question),
    ];

    inputTokens += estimateTokens(SYSTEM_PROMPT + question);

    const maxToolRounds = 3;
    let llm = createLLM(currentRoute, true);

    for (let round = 0; round < maxToolRounds; round++) {
      let response: AIMessage;

      try {
        response = (await llm.invoke(messages)) as AIMessage;
      } catch (error) {
        // 主模型失败，尝试降级
        if (currentRoute.fallback && !usedFallback) {
          console.warn(
            `[Agent] 主模型 ${currentRoute.modelName} 失败，切换到备用模型 ${currentRoute.fallback.modelName}`
          );
          usedFallback = true;
          fallbackReason =
            error instanceof Error ? error.message : "Unknown error";

          // 记录健康检查
          await router.recordHealthCheck(
            currentRoute.modelId,
            false,
            undefined,
            fallbackReason
          );

          // 切换到备用模型
          currentRoute = {
            ...currentRoute.fallback,
            inputPrice: currentRoute.inputPrice, // 保持价格信息
            outputPrice: currentRoute.outputPrice,
          };
          llm = createLLM(currentRoute, true);

          // 重试
          response = (await llm.invoke(messages)) as AIMessage;
        } else {
          throw error;
        }
      }

      // 没有工具调用，进入最终回答
      if (!response.tool_calls || response.tool_calls.length === 0) {
        // 流式输出最终回答
        const answerLLM = createLLM(currentRoute, false);
        const stream = await answerLLM.stream(messages);

        let outputContent = "";
        for await (const chunk of stream) {
          const content = extractTextContent(chunk.content);
          if (content) {
            outputContent += content;
            yield { type: "text_delta", content };
          }
        }

        outputTokens += estimateTokens(outputContent);
        break;
      }

      messages.push(response);

      // 执行工具调用
      for (const toolCall of response.tool_calls) {
        yield {
          type: "tool_start",
          tool: toolCall.name,
          args: toolCall.args,
        };

        const { result, latencyMs } = await executeTool(
          toolCall.name,
          toolCall.args
        );

        toolCallRecords.push({ tool: toolCall.name, latencyMs });

        yield {
          type: "tool_end",
          tool: toolCall.name,
          result: createToolPreview(result),
        };

        messages.push(
          new ToolMessage({
            content: result,
            tool_call_id: toolCall.id!,
          })
        );

        inputTokens += estimateTokens(result);
      }
    }

    // ===== 4. 记录调用日志 =====
    const latencyMs = Date.now() - startTime;
    const cost = logger.calculateCost(
      inputTokens,
      outputTokens,
      currentRoute.inputPrice,
      currentRoute.outputPrice
    );

    await logger.log({
      modelId: currentRoute.modelId,
      sessionId,
      intentType: intent,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      latencyMs,
      status: "success",
      usedFallback,
      fallbackReason,
      toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
    });

    yield { type: "done" };
  } catch (error) {
    // 记录错误日志
    const latencyMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (currentRoute) {
      await logger.log({
        modelId: currentRoute.modelId,
        sessionId,
        intentType: intent,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        cost: 0,
        latencyMs,
        status: "error",
        errorMessage,
        usedFallback,
        fallbackReason,
        toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
      });
    }

    yield {
      type: "error",
      message: `服务暂时不可用: ${errorMessage}`,
    };
    yield { type: "done" };
  }
}

// 导出别名
export { runAgentEnterprise as runAgent };
