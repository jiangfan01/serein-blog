/**
 * Agent 编排层
 *
 * 核心逻辑：Function Calling 循环
 *
 * 1. 把用户问题 + 工具定义发给模型
 * 2. 模型返回两种可能：
 *    a. 直接回答（不需要工具）→ 流式输出 text_delta 事件
 *    b. tool_calls（需要调工具）→ 输出 tool_start/tool_end 事件 → 再流式输出最终回答
 *
 * 改造点（相比上一版）：
 * - yield 的不再是纯字符串，而是 SSEEvent 对象
 * - 工具调用过程也会 yield 事件，前端能看到 Agent 在干什么
 */
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { BaseMessage, AIMessage } from "@langchain/core/messages";
import { allTools } from "./tools";
import type { SSEEvent } from "./types";

const SYSTEM_PROMPT = `你是 Serein Blog 的 AI 助手，一个面向开发者的技术知识库工作台。

## 你的能力
1. **rag_search** — 在博客笔记知识库中语义检索。博客覆盖：React、Vue、JavaScript、CSS、Node.js、算法、Agent 开发、SSE 架构、RAG 架构、Workflow 工作流等。
2. **web_search** — 联网搜索实时信息和最新技术动态。

## 决策规则
- 用户问博客笔记可能覆盖的技术话题 → 优先用 rag_search
- 用户问实时信息或博客未覆盖的话题 → 用 web_search
- 用户问通用编程知识（不需要检索就能回答的）→ 直接回答
- 简单打招呼或闲聊 → 直接回答，不调用工具
- 对比类问题（如"React 和 Vue 的区别"）→ 可以多次调用 rag_search 分别检索

## 回答规范
- 使用中文回答，技术术语保留英文
- 基于工具返回的内容回答，不要编造工具没有返回的信息
- 如果工具返回的信息不足，诚实说明，可以结合自身知识补充但要标注
- 代码示例使用 markdown 代码块，标注语言
- 回答简洁有条理，避免冗余`;

/**
 * 创建绑定了工具的 LLM
 */
function createAgentLLM() {
  const llm = new ChatOpenAI({
    model: "kimi-k2-0711-preview",
    apiKey: process.env.MOONSHOT_API_KEY,
    configuration: {
      baseURL: "https://api.moonshot.cn/v1",
    },
    temperature: 0,
    streaming: true,
  });

  return llm.bindTools(allTools);
}

/**
 * 执行工具调用
 */
async function executeTool(
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<string> {
  const targetTool = allTools.find((t) => t.name === toolName);

  if (!targetTool) {
    return `未知工具: ${toolName}`;
  }

  try {
    // LangChain tool.invoke 接受 ToolCall 格式
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (targetTool as any).invoke(toolArgs);
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error) {
    return `工具执行失败: ${error instanceof Error ? error.message : "未知错误"}`;
  }
}

/**
 * Agent 主函数
 *
 * 现在 yield 的是 SSEEvent 对象，不再是纯字符串。
 * route.ts 拿到后直接 JSON.stringify 推给前端。
 */
export async function* runAgent(
  question: string
): AsyncGenerator<SSEEvent, void, unknown> {
  const llm = createAgentLLM();

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(question),
  ];

  // ===== 第一次调用模型（非流式，因为要判断有没有 tool_calls）=====
  // 通知前端：模型开始思考
  yield { type: "thinking" };

  const response = await llm.invoke(messages);
  const aiMessage = response as AIMessage;

  // 模型决定直接回答，不需要工具
  if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
    // 重新做一次流式调用
    const stream = await llm.stream(messages);
    for await (const chunk of stream) {
      if (typeof chunk.content === "string" && chunk.content) {
        yield { type: "text_delta", content: chunk.content };
      }
    }
    return;
  }

  // ===== 模型要调用工具 =====
  messages.push(aiMessage);

  for (const toolCall of aiMessage.tool_calls) {
    // 通知前端：开始调用工具
    yield {
      type: "tool_start",
      tool: toolCall.name,
      args: toolCall.args,
    };

    // 执行工具
    const result = await executeTool(toolCall.name, toolCall.args);

    // 通知前端：工具调用完成
    yield {
      type: "tool_end",
      tool: toolCall.name,
      result:
        result.length > 200 ? result.slice(0, 200) + "..." : result,
    };

    // 把工具结果加入消息历史
    messages.push(
      new ToolMessage({
        content: result,
        tool_call_id: toolCall.id!,
      })
    );
  }

  // ===== 第二次调用模型（流式，生成最终回答）=====
  const finalStream = await llm.stream(messages);

  for await (const chunk of finalStream) {
    if (typeof chunk.content === "string" && chunk.content) {
      yield { type: "text_delta", content: chunk.content };
    }
  }
}
