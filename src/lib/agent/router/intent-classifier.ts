/**
 * 意图分类器
 *
 * 用小模型做意图分类，替代硬编码关键词匹配
 *
 * 设计思路：
 * 1. 用最便宜的模型（DeepSeek Flash）做分类
 * 2. 输出结构化 JSON，包含意图类型和置信度
 * 3. 有缓存机制，相似问题不重复分类
 */
import { ChatOpenAI } from "@langchain/openai";
import type { IntentType, IntentResult } from "./types";

// 分类提示词
const CLASSIFIER_PROMPT = `你是一个意图分类器。根据用户的问题，判断属于以下哪种意图类型：

1. simple_chat - 简单闲聊、打招呼、感谢、告别等
2. rag_query - 询问博客/笔记/文章内容、博主的经验和观点
3. web_search - 需要联网搜索的实时信息、最新版本、天气、新闻等
4. complex_reasoning - 需要深度思考的问题：为什么、原理、底层机制、详细分析、对比
5. code_analysis - 代码相关：代码审查、bug分析、重构建议、代码解释

判断规则：
- 如果用户明确说"搜索/查一下/最新/天气/新闻"，选 web_search
- 如果用户明确说"博客/笔记/你写过/你之前"，选 rag_query
- 如果问题包含"为什么/原理/底层/深入分析"，选 complex_reasoning
- 如果问题包含代码块或明确要分析代码，选 code_analysis
- 简单问候或闲聊选 simple_chat

请只返回 JSON 格式：
{
  "intent": "意图类型",
  "confidence": 0.0-1.0的置信度,
  "reasoning": "简短的分类理由"
}`;

/**
 * 意图分类器
 */
export class IntentClassifier {
  private llm: ChatOpenAI;
  private cache: Map<string, IntentResult> = new Map();

  constructor() {
    // 用最便宜的模型做分类
    this.llm = new ChatOpenAI({
      model: "deepseek-v4-flash",
      apiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: "https://api.deepseek.com",
      },
      temperature: 0,
      maxTokens: 100, // 分类不需要长输出
    });
  }

  /**
   * 分类用户意图
   */
  async classify(question: string): Promise<IntentResult> {
    // 1. 检查缓存
    const cacheKey = this.getCacheKey(question);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. 快速规则匹配（节省 API 调用）
    const quickResult = this.quickMatch(question);
    if (quickResult.confidence >= 0.9) {
      this.cache.set(cacheKey, quickResult);
      return quickResult;
    }

    // 3. 调用模型分类
    try {
      const response = await this.llm.invoke([
        { role: "system", content: CLASSIFIER_PROMPT },
        { role: "user", content: question },
      ]);

      const content =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      // 解析 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as IntentResult;
        // 验证意图类型
        if (this.isValidIntent(parsed.intent)) {
          this.cache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.error("[IntentClassifier] 分类失败:", error);
    }

    // 4. 降级到规则匹配
    this.cache.set(cacheKey, quickResult);
    return quickResult;
  }

  /**
   * 快速规则匹配（不调用 API）
   */
  private quickMatch(question: string): IntentResult {
    const q = question.toLowerCase();

    // 代码分析 - 最高优先级
    if (
      q.includes("```") ||
      q.includes("这段代码") ||
      q.includes("代码审查") ||
      q.includes("review") ||
      q.includes("bug")
    ) {
      return {
        intent: "code_analysis",
        confidence: 0.95,
        reasoning: "包含代码或代码分析关键词",
      };
    }

    // 复杂推理
    if (
      q.includes("为什么") ||
      q.includes("原理") ||
      q.includes("底层") ||
      q.includes("深入") ||
      q.includes("详细分析")
    ) {
      return {
        intent: "complex_reasoning",
        confidence: 0.9,
        reasoning: "包含深度思考关键词",
      };
    }

    // 联网搜索
    if (
      q.includes("搜索") ||
      q.includes("搜一下") ||
      q.includes("查一下") ||
      q.includes("最新") ||
      q.includes("天气") ||
      q.includes("新闻") ||
      q.includes("版本")
    ) {
      return {
        intent: "web_search",
        confidence: 0.9,
        reasoning: "包含搜索或实时信息关键词",
      };
    }

    // RAG 查询
    if (
      q.includes("博客") ||
      q.includes("笔记") ||
      q.includes("文章") ||
      q.includes("你写过") ||
      q.includes("你之前")
    ) {
      return {
        intent: "rag_query",
        confidence: 0.9,
        reasoning: "包含博客/笔记关键词",
      };
    }

    // 简单闲聊
    if (
      q.includes("你好") ||
      q.includes("hi") ||
      q.includes("hello") ||
      q.includes("谢谢") ||
      q.includes("再见")
    ) {
      return {
        intent: "simple_chat",
        confidence: 0.95,
        reasoning: "简单问候或闲聊",
      };
    }

    // 默认 - 置信度低，会触发模型分类
    return {
      intent: "simple_chat",
      confidence: 0.5,
      reasoning: "无明确信号，默认闲聊",
    };
  }

  /**
   * 生成缓存 key
   */
  private getCacheKey(question: string): string {
    // 简单处理：取前100字符，去除空格
    return question.slice(0, 100).replace(/\s+/g, " ").trim();
  }

  /**
   * 验证意图类型
   */
  private isValidIntent(intent: string): intent is IntentType {
    return [
      "simple_chat",
      "rag_query",
      "web_search",
      "complex_reasoning",
      "code_analysis",
    ].includes(intent);
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }
}

// 单例
let classifierInstance: IntentClassifier | null = null;

export function getIntentClassifier(): IntentClassifier {
  if (!classifierInstance) {
    classifierInstance = new IntentClassifier();
  }
  return classifierInstance;
}
