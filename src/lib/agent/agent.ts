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

const SYSTEM_PROMPT = `你是 Serein Blog 的 AI 助手，帮助用户回答技术问题。

你有以下能力：
1. 搜索博客笔记内容（rag_search）— 用于回答博客中有的技术话题
2. 联网搜索（web_search）— 用于回答博客中没有的、需要最新信息的问题

使用规则：
- 如果用户问的是博客笔记可能覆盖的内容（React、Vue、JavaScript、CSS、算法、Agent 开发等），优先用 rag_search
- 如果用户问的是最新技术动态、博客未覆盖的话题，用 web_search
- 如果是简单的打招呼或闲聊，直接回答，不需要调用任何工具
- 回答使用中文，语气专业但不生硬
- 如果工具返回的信息不足以回答，诚实说明`;

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
