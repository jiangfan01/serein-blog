/**
 * 工具结果解析器
 * 
 * 将工具返回的原始数据解析成前端可用的结构化格式
 */

export type WebSourceItem = {
  index: number;
  title: string;
  content: string;
  url: string;
};

export type WebSearchResult = {
  answer?: string;
  items: WebSourceItem[];
};

/**
 * 解析 web_search 工具返回的结果
 * 支持 JSON 格式（新）和文本格式（旧，兼容）
 */
export function parseWebSearchResult(value: string): WebSearchResult {
  // 尝试解析 JSON 格式（新格式）
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.results)) {
      return {
        answer: parsed.answer || undefined,
        items: parsed.results.map(
          (r: { title: string; content: string; url: string }, i: number) => ({
            index: i + 1,
            title: r.title,
            content: r.content,
            url: r.url,
          })
        ),
      };
    }
  } catch {
    // 不是 JSON，尝试旧格式解析
  }

  // 旧格式解析（兼容）
  const answerMatch = value.match(/直接答案：([\s\S]*?)(?:\n\n搜索结果：|$)/);
  const answer = answerMatch?.[1]?.trim();
  const itemRegex =
    /\[(\d+)\]\s+(.+?)\n([\s\S]*?)\n来源:\s*(https?:\/\/\S+)/g;
  const items: WebSourceItem[] = [];

  for (const match of value.matchAll(itemRegex)) {
    items.push({
      index: Number(match[1]),
      title: match[2].trim(),
      content: match[3].trim(),
      url: match[4].trim(),
    });
  }

  return { answer, items };
}
