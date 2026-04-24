/**
 * 联网搜索工具
 *
 * 用 Tavily Search API 实现。Tavily 是专门为 AI Agent 设计的搜索引擎，
 * 返回结构化的搜索结果（标题 + 摘要 + URL），不需要自己爬网页。
 *
 * 什么时候模型会选这个工具而不是 RAG：
 * 靠 description 里的描述 — "博客笔记中没有的内容"、"最新技术动态"
 * 模型会对比两个工具的 description，选最匹配用户意图的那个。
 */
import {tool} from "@langchain/core/tools";
import {z} from "zod";

export const webSearchTool = tool(
  async ({ query }: { query: string }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return "联网搜索服务未配置，无法搜索。";
    }

    try {
      // Tavily 的 API 很简单：POST 一个 query，返回搜索结果
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 3, // 只取前 3 条，够用且省 token
          search_depth: "basic", // basic 够用，advanced 更慢更贵
        }),
      });

      if (!response.ok) {
        return `搜索失败: ${response.status}`;
      }

      const data = await response.json();

      // 把搜索结果格式化成模型容易理解的文本
      if (!data.results?.length) {
        return "没有找到相关的搜索结果。";
      }

      return data.results
          .map(
              (r: { title: string; content: string; url: string }, i: number) =>
                  `[${i + 1}] ${r.title}\n${r.content}\n来源: ${r.url}`
          )
          .join("\n\n");
    } catch (error) {
      return `搜索出错: ${error instanceof Error ? error.message : "未知错误"}`;
    }
  },
  {
    name: "web_search",

    description:
      "联网搜索最新的技术信息。当用户的问题涉及博客笔记中可能没有的内容时使用，比如最新的技术动态、特定库的最新版本、博客未覆盖的技术话题。",

    schema: z.object({
      query: z
        .string()
        .describe("搜索关键词，用简洁的英文或中文技术术语"),
    }),
  }
);
