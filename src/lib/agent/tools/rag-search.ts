/**
 * RAG 检索工具
 *
 * 把已有的 retrieveContext 包装成 LangChain tool。
 * tool() 做了两件事：
 * 1. 生成 JSON Schema 告诉模型"这个工具叫什么、参数是什么"
 * 2. 包装执行函数，模型决定调用时自动执行
 *
 * 模型不会看到 retrieveContext 的实现代码，
 * 它只看到 name + description + schema，然后决定要不要调用。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retrieveContext } from "@/lib/rag/retriever";

export const ragSearchTool = tool(
  // 第一个参数：执行函数 — 模型决定调用时，实际跑的代码
  async ({ query }: { query: string }) => {
    const context = await retrieveContext(query);

    if (!context) {
      return "没有找到相关的博客笔记内容。";
    }

    return context;
  },
  {
    // name: 模型在 tool_calls 里会用这个名字
    name: "rag_search",

    // description: 模型靠这段话判断"什么时候该用这个工具"
    // 写清楚：能干什么、什么时候用、什么时候不用
    description:
      "在 Serein Blog 的笔记知识库中进行语义检索。当用户询问博客中的技术笔记内容时使用，比如 React、Vue、JavaScript、CSS、算法、Agent 开发等话题。不要用于与博客笔记无关的问题。",

    // schema: 用 zod 定义参数，LangChain 会自动转成 JSON Schema 给模型
    schema: z.object({
      query: z
        .string()
        .describe("搜索关键词，提取用户问题中的核心技术术语"),
    }),
  }
);
