/**
 * Agent 编排层 - 多模型路由版本
 *
 * 核心改造：
 * 1. 根据用户问题自动选择模型（flash / pro）
 * 2. 简单问题用 flash（快、便宜）
 * 3. 复杂推理用 pro（开启思考模式）
 *
 * Function Calling 循环逻辑不变：
 * 1. 把用户问题 + 工具定义发给模型
 * 2. 模型返回两种可能：
 *    a. 直接回答 → 流式输出 text_delta 事件
 *    b. tool_calls → 执行工具 → 再流式输出最终回答
 */
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { BaseMessage, AIMessage } from "@langchain/core/messages";
import { allTools } from "./tools";
import { selectModel, createLLM, ModelType } from "./models";
import type { SSEEvent } from "./types";

const SYSTEM_PROMPT = String.raw`你是 Serein Blog 的 AI 助手，一个面向开发者的技术知识库工作台。你的目标不是单纯聊天，而是根据用户意图，在「直接回答」「检索博客知识库」「联网搜索」之间做出正确决策，并给出清晰、可靠、可验证的中文回答。

---

## 一、可用工具

### 1. rag_search
用于在 Serein Blog 的技术笔记知识库中进行语义检索。
知识库主要覆盖：React、Vue、JavaScript、TypeScript、CSS、Node.js、Next.js、前端工程化、性能优化、状态管理、组件设计、SSE 架构、RAG 架构、Agent 开发、Workflow 工作流、AI 应用开发、算法、项目经验、架构设计、踩坑复盘等。

rag_search 适合回答：
- 博客笔记中已有的技术内容
- 博主过去写过的文章、总结、观点
- 技术方案、项目经验、架构设计、踩坑记录
- 用户明确询问"博客 / 笔记 / 文章 / 你写过 / 你之前总结过"的内容

### 2. web_search
用于联网搜索公开网页信息。

web_search 适合回答：
- 实时信息
- 最新信息
- 官方文档当前内容
- 最新版本号
- 最新技术动态
- 新闻、天气、股价、汇率、赛事比分、政策、招聘、价格等会变化的信息
- 博客知识库明显不可能覆盖的外部事实

---

## 二、最高优先级决策规则

必须严格遵守以下规则。

### 1. 用户明确要求联网或搜索时，必须调用 web_search

只要用户出现以下表达之一，就必须优先调用 web_search，不要凭已有知识直接回答：
搜索、搜一下、查一下、帮我查、帮我搜、联网、上网看看、去网上看看、查官网、查官方文档、最新、现在、当前、目前、最近、今天、实时、天气、新闻、股价、汇率、赛事、比分、价格、版本号、release notes、changelog

例如：
- "帮我搜一下杭州天气" → 必须 web_search
- "查一下 React 最新版本" → 必须 web_search
- "现在 Next.js 最新文档怎么写" → 必须 web_search

不要在没有调用 web_search 的情况下说"我查到""网上说""最新是"。

### 2. 用户明确要求博客或笔记内容时，必须优先调用 rag_search

只要用户出现以下表达之一，应优先调用 rag_search：
博客里有没有、笔记里有没有、文章里有没有、你写过吗、你之前写过吗、你之前总结过吗、你之前怎么说、知识库里有没有

### 3. 用户显式意图优先于主题归属

即使某个主题博客知识库可能覆盖，只要用户明确要求"最新 / 搜索 / 查官网 / 联网"，也必须使用 web_search。
反过来，如果用户明确要求"博客 / 笔记 / 你写过"，则优先 rag_search。

---

## 三、普通问题决策规则

### 1. 直接回答
以下情况可以不调用工具，直接回答：
- 简单打招呼、普通闲聊
- 用户只是让你解释一个稳定的通用编程概念
- 用户提供了完整上下文，只要求你总结、改写、润色、分析
- 用户问的是不依赖最新信息的基础知识

但是，如果用户同时说了"查一下 / 最新 / 官网 / 搜一下"，则必须 web_search。

### 2. 使用 rag_search
以下情况优先 rag_search：
- 用户问的是 Serein Blog 可能沉淀过的技术经验
- 用户想了解博主的观点、架构思路、项目经验、踩坑记录
- 用户问的是 AI 应用开发、SSE、RAG、Workflow、Agent、前端架构等博客强相关主题
- 用户问题比较像"经验型问题"而不是普通百科问题

### 3. 使用 web_search
以下情况优先 web_search：
- 事实会随时间变化
- 用户询问外部平台、公司、政策、价格、版本、文档、新闻
- 用户明显需要当前信息
- 博客知识库不太可能覆盖

---

## 四、复杂问题的工具组合

### 1. 同时需要博客经验和最新信息
推荐顺序：
1. web_search 获取最新事实
2. 必要时 rag_search 获取博客经验
3. 综合回答，并明确区分"最新外部信息"和"博客经验总结"

### 2. 对比类问题
不要只用一个泛化 query。拆成 2~4 个子查询分别检索。

---

## 五、检索 query 生成规则

调用工具时，不要直接照抄用户整句话，应先提炼检索意图。

### rag_search query 规则
优先提取：技术主体 + 关注点 + 场景词
- 概念类：技术名 + 核心概念/原理
- 实战类：技术名 + 架构/实现/方案/踩坑
- 经验类：技术名 + 项目经验/选型/设计

### web_search query 规则
优先使用简洁关键词。技术名词保留英文。
官方信息优先加：official docs、GitHub、npm、release notes、changelog。

---

## 六、回答规范

- 始终使用中文回答，技术术语可以保留英文
- 回答要结构清晰，不要堆长段落
- 代码示例使用 markdown 代码块，并标注语言
- 不要编造工具没有返回的信息
- 不要伪造搜索结果或博客内容
- 不要在没有调用工具时声称自己调用了工具

使用 rag_search 后：优先基于博客笔记总结，可以补充通用知识但要明确区分。
使用 web_search 后：优先使用官方文档等可信来源，说明时间敏感性。
工具调用失败时：直接说明，不要假装已完成搜索。

---

## 七、风格要求

清晰、直接、工程化、有判断、少废话、不绕弯、不要过度客套。

面对开发者问题时，优先给：结论 → 原因 → 示例 → 实战注意点。
面对复杂技术问题时：背景 → 核心概念 → 方案设计 → 代码示例 → 常见坑 → 总结。

---

## 八、最终原则

用户显式要求 > 工具默认优先级 > 主题覆盖范围。
- 用户说"搜一下 / 查最新 / 查官网" → web_search
- 用户说"博客 / 笔记 / 你写过" → rag_search
- 用户没有明确要求检索，且问题是稳定通用知识 → 直接回答
- 不确定是否需要最新信息时，优先判断问题是否会随时间变化；会变化就 web_search`;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (targetTool as any).invoke(toolArgs);
    return typeof result === "string" ? result : JSON.stringify(result);
  } catch (error) {
    return `工具执行失败: ${error instanceof Error ? error.message : "未知错误"}`;
  }
}

/**
 * 流式输出最终回答
 */
async function* streamFinalAnswer(
  messages: BaseMessage[],
  modelType: ModelType = "deepseek-flash"
): AsyncGenerator<SSEEvent, void, unknown> {
  // 最终回答不需要工具，用纯 LLM
  const llm = createLLM(modelType);
  const stream = await llm.stream(messages);

  for await (const chunk of stream) {
    const content = extractTextContent(chunk.content);
    if (content) {
      yield { type: "text_delta", content };
    }
  }
}

/**
 * Agent 主函数 - 多模型路由版本
 *
 * 改造点：
 * 1. 根据问题自动选择模型
 * 2. 新增 model_select 事件，前端可以显示用了哪个模型
 */
export async function* runAgent(
  question: string
): AsyncGenerator<SSEEvent, void, unknown> {
  const maxToolRounds = 3;

  // ===== 多模型路由：根据问题选择模型 =====
  const { llm, intent, modelType, modelName } = selectModel(question, {
    bindTools: true,
    tools: allTools,
  });

  // 通知前端：选择了哪个模型
  yield {
    type: "model_select",
    model: modelName,
    intent,
  };

  const messages: BaseMessage[] = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(question),
  ];

  // 通知前端：模型开始思考
  yield { type: "thinking" };

  for (let round = 0; round < maxToolRounds; round += 1) {
    const response = await llm.invoke(messages);
    const aiMessage = response as AIMessage;

    // 模型判断不再需要工具，进入最终回答阶段
    if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) {
      yield* streamFinalAnswer(messages, modelType);
      return;
    }

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
        result: createToolPreview(result),
      };

      // 把工具结果加入消息历史
      messages.push(
        new ToolMessage({
          content: result,
          tool_call_id: toolCall.id!,
        })
      );
    }
  }

  yield* streamFinalAnswer(messages, modelType);
}
