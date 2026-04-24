/**
 * 联网搜索工具
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const webSearchTool = tool(
  async ({ query }: { query: string }) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      return "联网搜索服务未配置，无法搜索。";
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 5,
          search_depth: "basic",
          include_answer: true,
        }),
      });

      if (!response.ok) {
        return `搜索失败: ${response.status}`;
      }

      const data = await response.json();

      // 如果 Tavily 返回了直接答案，优先使用
      let result = "";
      if (data.answer) {
        result += `直接答案：${data.answer}\n\n`;
      }

      if (data.results?.length) {
        const formatted = data.results
          .map(
            (r: { title: string; content: string; url: string }, i: number) =>
              `[${i + 1}] ${r.title}\n${r.content}\n来源: ${r.url}`
          )
          .join("\n\n");
        result += `搜索结果：\n${formatted}`;
      }

      return result || "没有找到相关的搜索结果。";
    } catch (error) {
      return `搜索出错: ${error instanceof Error ? error.message : "未知错误"}`;
    }
  },
  {
    name: "web_search",

    description: `联网搜索最新的技术信息和实时数据。

使用场景：
- 用户询问实时信息（天气、新闻、股价、赛事比分等）
- 用户询问最新的技术动态（某个库的最新版本、新发布的框架特性等）
- 用户询问博客笔记中不太可能覆盖的话题
- 用户明确要求"搜索"、"查一下"、"最新的"等

不要使用的场景：
- 用户问的是博客笔记中已有的技术内容（优先用 rag_search）
- 简单的打招呼或闲聊
- 用户问的是通用编程知识（可以直接回答）

查询技巧：
- 用简洁的关键词搜索，不要用完整的句子
- 中文话题用中文搜索，英文技术名词保留英文
- 加上时间限定词（如"2024"、"最新"）可以获得更新的结果`,

    schema: z.object({
      query: z
        .string()
        .describe("搜索关键词，用简洁的中文或英文技术术语，如 '杭州今日天气' 或 'Next.js 15 new features'"),
    }),
  }
);
