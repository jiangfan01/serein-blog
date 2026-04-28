/**
 * LangGraph Agent 编排层
 *
 * 相比手写 Function Calling 循环的优势：
 * 1. 状态管理：自动管理消息历史、工具调用状态
 * 2. 条件路由：根据模型输出决定下一步（调工具 or 回答）
 * 3. 可视化：可以导出图结构，方便调试
 * 4. 可扩展：加新节点（如 human-in-the-loop）很方便
 *
 * 图结构：
 *   START → agent → should_continue? → tools → agent → ... → END
 *                         ↓
 *                        END
 */
import { Annotation, StateGraph, END, START } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
} from "@langchain/core/messages";
import { allTools } from "./tools";
import { createLLM, classifyIntent, INTENT_MODEL_MAP, MODEL_CONFIGS } from "./models";
import type { SSEEvent } from "./types";
import type { ModelType } from "./models";

// ============ 系统提示词 ============

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

// ============ 状态定义 ============

// 使用 Annotation 定义状态
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  modelType: Annotation<ModelType>({
    reducer: (_, next) => next,
    default: () => "deepseek-flash" as ModelType,
  }),
  modelName: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "deepseek-v4-flash",
  }),
  intent: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "simple_chat",
  }),
});

type AgentStateType = typeof AgentState.State;

// ============ 图节点 ============

/**
 * Agent 节点：调用 LLM
 */
async function agentNode(state: AgentStateType): Promise<Partial<AgentStateType>> {
  const llm = createLLM(state.modelType, {
    bindTools: true,
    tools: allTools,
  });

  const response = await llm.invoke(state.messages);

  return {
    messages: [response],
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

/**
 * 创建 Agent 图
 */
function createAgentGraph() {
  // 创建工具节点
  const toolNode = new ToolNode(allTools);

  // 构建图
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

// ============ 辅助函数 ============

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof item.text === "string"
        ) {
          return item.text;
        }
        return "";
      })
      .join("");
  }

  return "";
}

function createToolPreview(result: string): string {
  return result.length > 2000 ? `${result.slice(0, 2000)}...` : result;
}

// ============ 主函数 ============

/**
 * LangGraph Agent 主函数
 *
 * 使用 streamEvents 获取流式输出和中间状态
 */
export async function* runAgentGraph(
  question: string
): AsyncGenerator<SSEEvent, void, unknown> {
  const graph = createAgentGraph();

  // 根据问题选择模型
  const intent = classifyIntent(question);
  const modelType = INTENT_MODEL_MAP[intent];
  const modelName = MODEL_CONFIGS[modelType].model;

  // 初始状态
  const initialState = {
    messages: [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(question),
    ],
    modelType,
    modelName,
    intent,
  };

  // 通知前端：选择了哪个模型
  yield {
    type: "model_select",
    model: modelName,
    intent,
  };

  // 通知前端：开始思考
  yield { type: "thinking" };

  // 用于追踪已处理的工具调用
  const processedToolCalls = new Set<string>();

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
        yield {
          type: "tool_end",
          tool: toolName,
          result: createToolPreview(typeof result === "string" ? result : JSON.stringify(result)),
        };
      }
    }

    // LLM 流式输出
    if (event.event === "on_chat_model_stream") {
      const chunk = event.data?.chunk;
      if (chunk) {
        const content = extractTextContent(chunk.content);
        if (content) {
          yield { type: "text_delta", content };
        }
      }
    }
  }

  yield { type: "done" };
}

// 导出原来的接口名，方便切换
export { runAgentGraph as runAgent };
