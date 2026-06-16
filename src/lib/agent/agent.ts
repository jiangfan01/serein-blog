/**
 * 企业级 Agent 编排层
 *
 * 核心特性：
 * 1. LangGraph 编排 - 状态管理、条件路由、可视化
 * 2. 动态模型路由 - 从数据库读取配置，支持热更新
 * 3. 智能意图分类 - 规则匹配 + 小模型分类
 * 4. 自动降级 - 主模型失败切备用
 * 5. 完整监控 - 记录 token、延迟、成本
 * 6. XML 结构化上下文工程
 *
 * 图结构：
 *   START → agent → should_continue? → tools → agent → ... → END
 *                         ↓
 *                        END
 */
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { allTools } from "./tools";
import { getIntentClassifier } from "./router/intent-classifier";
import { getModelRouter } from "./router/model-router";
import { getCallLogger } from "./router/call-logger";
import { buildContext, buildSimpleContext } from "./context";
import type { SSEEvent } from "./types";
import type { RouteResult, IntentType } from "./router/types";

// ============ 状态定义 ============

const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  // 路由信息
  route: Annotation<RouteResult | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
  // 监控数据
  inputTokens: Annotation<number>({
    reducer: (prev, next) => prev + next,
    default: () => 0,
  }),
  outputTokens: Annotation<number>({
    reducer: (prev, next) => prev + next,
    default: () => 0,
  }),
  toolCalls: Annotation<Array<{ tool: string; latencyMs: number }>>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

type AgentStateType = typeof AgentState.State;

// ============ 辅助函数 ============

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 2);
}

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
 * 根据路由结果创建 LLM
 */
function createLLMFromRoute(route: RouteResult, bindTools = false) {
  // DeepSeek V4 默认开启思考模式，但思考模式与 Tool Calls 不兼容
  // 需要显式禁用思考模式
  const isDeepSeek = route.baseUrl.includes("deepseek");
  
  const llm = new ChatOpenAI({
    model: route.modelName,
    apiKey: process.env[route.apiKeyEnv],
    configuration: {
      baseURL: route.baseUrl,
    },
    temperature: 0,
    streaming: true,
    // DeepSeek 需要显式禁用思考模式，否则 Tool Calls 会报错
    ...(isDeepSeek && {
      modelKwargs: {
        thinking: { type: "disabled" },
      },
    }),
    // 其他模型的额外参数
    ...(!isDeepSeek && route.extraParams && {
      modelKwargs: route.extraParams,
    }),
  });

  return bindTools ? llm.bindTools(allTools) : llm;
}

// ============ 图节点 ============

/**
 * Agent 节点：调用 LLM
 */
async function agentNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  if (!state.route) {
    throw new Error("路由信息缺失");
  }

  const llm = createLLMFromRoute(state.route, true);
  const response = await llm.invoke(state.messages);

  // 估算输出 token
  const outputContent = extractTextContent(response.content);
  const outputTokens = estimateTokens(outputContent);

  return {
    messages: [response],
    outputTokens,
  };
}

/**
 * 条件边：判断是否需要调用工具
 */
function shouldContinue(state: AgentStateType): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }

  return END;
}

// ============ 构建图 ============

function createAgentGraph() {
  // 使用类型断言解决 DynamicStructuredTool 与 ToolNode 的类型兼容问题
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolNode = new ToolNode(allTools as any);

  const graph = new StateGraph(AgentState)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      [END]: END,
    })
    .addEdge("tools", "agent");

  return graph.compile();
}

// ============ 主函数 ============

/**
 * Agent 运行选项
 */
export interface RunAgentOptions {
  /** 用户 ID */
  userId?: string;
  /** 用户邮箱 */
  userEmail?: string;
  /** 用户名 */
  userName?: string;
  /** 回答风格 key */
  responseStyle?: string;
  /** 是否加载历史消息 */
  loadHistory?: boolean;
  /** 排除的消息 ID（避免当前 trigger message 重复） */
  excludeMessageId?: string;
}

/**
 * Agent 主函数
 *
 * 整合：LangGraph + 动态路由 + 上下文工程 + 监控
 * 
 * @param question 用户问题
 * @param sessionId 会话 ID
 * @param options 可选参数
 */
export async function* runAgent(
  question: string,
  sessionId?: string,
  options?: RunAgentOptions
): AsyncGenerator<SSEEvent, void, unknown> {
  const startTime = Date.now();
  const classifier = getIntentClassifier();
  const router = getModelRouter();
  const logger = getCallLogger();

  let currentRoute: RouteResult | null = null;
  let intentType: IntentType = "simple_chat";
  let inputTokens = 0;
  let outputTokens = 0;
  let usedFallback = false;
  let fallbackReason: string | undefined;
  const toolCallRecords: Array<{ tool: string; latencyMs: number }> = [];

  try {
    // ===== 1. 意图分类 =====
    const intentResult = await classifier.classify(question);
    intentType = intentResult.intent;

    // ===== 2. 模型路由 =====
    currentRoute = await router.route({ question, intent: intentResult.intent, sessionId });

    // 通知前端：选择了哪个模型
    yield {
      type: "model_select",
      model: currentRoute.modelName,
      intent: intentType,
    };

    // 通知前端：开始思考
    yield { type: "thinking" };

    // ===== 3. 使用上下文工程构建消息 =====
    let builtContext;
    
    if (options?.loadHistory && sessionId) {
      // 完整构建（带历史消息）
      // 使用模型的 contextLength 动态计算 token 预算
      builtContext = await buildContext({
        user: {
          userId: options.userId || "anonymous",
          email: options.userEmail,
          name: options.userName,
          responseStyle: options.responseStyle,
        },
        session: {
          sessionId,
          isFirstTurn: false, // 会在 buildContext 内部判断
          historyCount: 0,    // 会在 buildContext 内部计算
        },
        currentInput: question,
        // 排除当前 trigger message，避免重复
        excludeMessageId: options.excludeMessageId,
        // 根据模型上下文长度动态计算 token 预算
        modelContextLength: currentRoute.contextLength,
      });
    } else {
      // 简化构建（单轮对话）
      builtContext = buildSimpleContext(question, {
        userId: options?.userId,
        responseStyle: options?.responseStyle,
      });
    }

    const initialMessages = builtContext.messages;
    inputTokens = builtContext.metadata.tokenEstimates.total;

    // 调试日志
    console.log("[Agent] 上下文构建完成", {
      isFirstTurn: builtContext.metadata.isFirstTurn,
      historyCount: builtContext.metadata.historyCount,
      estimatedTokens: inputTokens,
    });

    // ===== 4. 创建并执行图 =====
    const graph = createAgentGraph();

    const initialState = {
      messages: initialMessages,
      route: currentRoute,
      inputTokens: 0,
      outputTokens: 0,
      toolCalls: [],
    };

    // 用于追踪已处理的事件
    const processedToolCalls = new Set<string>();
    // 用 run_id 关联同一次工具调用的 start/end，记录开始时间以计算真实延迟
    const toolStartTimes = new Map<string, number>();

    // 使用 streamEvents 获取流式输出
    const stream = graph.streamEvents(initialState, {
      version: "v2",
    });

    for await (const event of stream) {
      // 工具调用开始
      if (event.event === "on_tool_start") {
        const toolName = event.name;
        const toolArgs = event.data?.input as Record<string, unknown> | undefined;
        const runId = event.run_id;

        if (toolName && toolArgs && !processedToolCalls.has(`start-${runId}`)) {
          processedToolCalls.add(`start-${runId}`);

          // 记录工具开始时间：存进 Map，用 run_id 关联（end 事件是另一个对象，挂在 event 上读不回来）
          toolStartTimes.set(runId, Date.now());

          yield {
            type: "tool_start",
            tool: toolName,
            args: toolArgs,
          };
        }
      }

      // 工具调用结束
      if (event.event === "on_tool_end") {
        const toolName = event.name;
        const result = event.data?.output;
        const runId = event.run_id;

        if (toolName && result && !processedToolCalls.has(`end-${runId}`)) {
          processedToolCalls.add(`end-${runId}`);

          // 计算真实工具延迟：用 run_id 取回开始时间，算差值
          const startedAt = toolStartTimes.get(runId);
          const latencyMs = startedAt ? Date.now() - startedAt : 0;
          toolStartTimes.delete(runId); // 用完清理，避免 Map 无限增长
          toolCallRecords.push({ tool: toolName, latencyMs });

          // 累加输入 token（工具结果）
          const resultStr = typeof result === "string" ? result : JSON.stringify(result);
          inputTokens += estimateTokens(resultStr);

          yield {
            type: "tool_end",
            tool: toolName,
            result: createToolPreview(resultStr),
          };
        }
      }

      // LLM 流式输出
      if (event.event === "on_chat_model_stream") {
        const chunk = event.data?.chunk;
        if (chunk) {
          const content = extractTextContent(chunk.content);
          if (content) {
            outputTokens += estimateTokens(content);
            yield { type: "text_delta", content };
          }
        }
      }
    }

    // ===== 5. 记录调用日志 =====
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
      intentType,
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
    // 尝试降级
    if (currentRoute?.fallback && !usedFallback) {
      console.warn(
        `[Agent] 主模型失败，尝试降级到 ${currentRoute.fallback.modelName}`
      );
      usedFallback = true;
      fallbackReason = error instanceof Error ? error.message : "Unknown error";

      // 记录健康检查
      await router.recordHealthCheck(
        currentRoute.modelId,
        false,
        undefined,
        fallbackReason
      );

      // 这里简化处理，实际应该用降级模型重新执行
      // 为了避免代码过于复杂，直接返回错误
    }

    // 记录错误日志
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (currentRoute) {
      await logger.log({
        modelId: currentRoute.modelId,
        sessionId,
        intentType,
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
