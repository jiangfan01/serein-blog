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

    description: `用于联网检索公开网页信息，获取实时信息、最新资料、官方文档、当前状态、版本信息、价格数据、新闻动态等内容。

【核心定位】
本工具是实时互联网搜索工具，不是博客知识库检索工具。当用户的问题依赖"当前信息""最新状态""外部公开资料"或用户明确要求联网搜索时，应优先调用本工具。

【必须使用的场景】
出现以下任一情况时，必须调用本工具：
1. 用户明确要求搜索、查一下、联网查、帮我搜、去网上看看、查官网、查文档、查最新资料
2. 用户询问实时信息，例如：天气、新闻、股价、汇率、赛事比分、票价、政策、招聘信息、产品价格、服务状态
3. 用户询问可能变化的信息，例如：某个库/框架/工具的最新版本、最新 API 用法、官方文档当前写法、最近发布的新功能、当前最佳实践、某个公司/产品/平台/模型/服务的最新情况
4. 用户询问博客知识库不太可能覆盖的话题，或者需要外部事实支持的问题
5. 用户的问题包含明显时间敏感词，例如：最新、现在、目前、当前、最近、今天、今年、实时、官方最新、还支持吗、现在还能用吗

【不要使用的场景】
以下情况不要调用本工具：
- 用户只是普通闲聊、打招呼、表达情绪
- 用户问的是稳定的通用编程概念，且没有要求搜索或最新信息
- 用户明确要求基于 Serein Blog / 笔记 / 你写过的内容回答，此时优先使用 rag_search
- 用户已经提供了完整上下文，只要求总结、改写、润色、解释已有内容
- 用户要求离线分析本地代码、已有报错、已给出的日志，且不需要最新资料

【与 rag_search 的优先级】
- 如果用户明确说"博客里有没有""笔记里怎么说""你之前写过吗"，优先 rag_search
- 如果用户明确说"帮我搜一下""查最新""看官网""联网查"，即使主题是技术问题，也优先 web_search
- 如果问题既可能有博客经验，又需要最新外部信息，可以先 web_search 获取当前事实，再结合已有知识回答
- 对于"最新版本 / 官方文档 / 当前 API / 最近变化"类问题，不要只依赖 rag_search

【查询生成规则】
调用本工具时，不要直接复制用户整句话，应提炼成简洁搜索 query：
- 中文实时问题：使用中文关键词
- 英文技术名词：保留英文原名
- 官方信息：优先加入 official、docs、release notes、changelog、GitHub、npm 等关键词
- 天气类：使用"城市 + 天气 + 今天/未来几天"
- 版本类：使用"库名 + latest version / npm / release notes"
- 技术动态类：使用"技术名 + latest / release / changelog / official docs"
- 中文技术问题可组合中文语义 + 英文技术名词

【结果使用规则】
- 优先引用官方文档、GitHub、npm、厂商公告、权威媒体等可信来源
- 不要把搜索结果中的广告、SEO 内容当作事实来源
- 如果搜索结果不足，应明确说明没有找到可靠结果
- 如果不同来源冲突，应说明差异并优先采用官方来源
- 不要在未调用本工具的情况下声称"我查到了"或"网上说"`,

    schema: z.object({
      query: z
        .string()
        .describe("搜索关键词，用简洁的中文或英文技术术语，如 '杭州今日天气' 或 'Next.js 15 new features'"),
    }),
  }
);
