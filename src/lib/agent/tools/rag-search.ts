/**
 * RAG 检索工具
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { retrieveContext } from "@/lib/rag/retriever";

export const ragSearchTool = tool(
  async ({ query }: { query: string }) => {
    const context = await retrieveContext(query);

    if (!context) {
      return "没有找到相关的博客笔记内容。";
    }

    return context;
  },
  {
    name: "rag_search",

    description: `在 Serein Blog 的笔记知识库中进行语义检索。

使用场景：
- 用户询问博客中已有的技术笔记内容（React、Vue、JavaScript、CSS、Node.js、算法、Agent 开发、SSE 架构、RAG 架构、Workflow 工作流等）
- 用户想了解博主的技术观点或项目经验
- 用户提到"笔记"、"博客"、"你写过"等关键词

不要使用的场景：
- 用户问的是实时信息（天气、新闻、最新版本号）
- 用户问的是博客笔记明显不会覆盖的话题（如医疗、法律、金融）
- 简单的打招呼或闲聊

查询技巧：
- 提取用户问题中的核心技术术语作为 query
- 如果用户问的是对比类问题（如"React 和 Vue 的区别"），分两次检索效果更好`,

    schema: z.object({
      query: z
        .string()
        .describe("搜索关键词，提取用户问题中的核心技术术语，如 'React Fiber 架构' 或 'Vue 响应式原理'"),
    }),
  }
);
