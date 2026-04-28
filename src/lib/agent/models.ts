/**
 * 多模型路由配置
 *
 * 设计思路：
 * - 不同任务用不同模型，优化成本和效果
 * - DeepSeek Flash：意图判断、简单闲聊、联网搜索（快、便宜）
 * - Kimi 128k：RAG 问答（长上下文，中文好）
 * - DeepSeek Pro：复杂推理、代码分析（思考模式）
 *
 * 模型能力：
 * - DeepSeek V4 Flash：1M 上下文，Tool Calls，便宜
 * - DeepSeek V4 Pro：1M 上下文，思考模式，推理强
 * - Kimi moonshot-v1-128k：128k 上下文，中文优化
 */
import { ChatOpenAI } from "@langchain/openai";

// ============ 模型提供商配置 ============

export type Provider = "deepseek" | "kimi";

interface ProviderConfig {
  baseURL: string;
  apiKeyEnv: string;
}

const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  deepseek: {
    baseURL: "https://api.deepseek.com",
    apiKeyEnv: "DEEPSEEK_API_KEY",
  },
  kimi: {
    baseURL: "https://api.moonshot.cn/v1",
    apiKeyEnv: "MOONSHOT_API_KEY",
  },
};

// ============ 模型配置 ============

export type ModelType = 
  | "deepseek-flash" 
  | "deepseek-pro" 
  | "kimi-8k" 
  | "kimi-32k" 
  | "kimi-128k"
  | "kimi-k2";

interface ModelConfig {
  provider: Provider;
  model: string;
  displayName: string;
  description: string;
  contextLength: string;
  // DeepSeek Pro 的思考模式配置
  thinking?: {
    type: "enabled" | "disabled";
  };
  reasoningEffort?: "low" | "medium" | "high";
}

export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  "deepseek-flash": {
    provider: "deepseek",
    model: "deepseek-v4-flash",
    displayName: "DeepSeek Flash",
    description: "快速、低成本",
    contextLength: "1M",
  },
  "deepseek-pro": {
    provider: "deepseek",
    model: "deepseek-v4-pro",
    displayName: "DeepSeek Pro",
    description: "强推理能力，思考模式",
    contextLength: "1M",
    thinking: { type: "enabled" },
    reasoningEffort: "medium",
  },
  "kimi-8k": {
    provider: "kimi",
    model: "moonshot-v1-8k",
    displayName: "Kimi 8K",
    description: "轻量快速",
    contextLength: "8K",
  },
  "kimi-32k": {
    provider: "kimi",
    model: "moonshot-v1-32k",
    displayName: "Kimi 32K",
    description: "中等上下文",
    contextLength: "32K",
  },
  "kimi-128k": {
    provider: "kimi",
    model: "moonshot-v1-128k",
    displayName: "Kimi 128K",
    description: "长上下文，适合 RAG",
    contextLength: "128K",
  },
  "kimi-k2": {
    provider: "kimi",
    model: "kimi-k2-0711-preview",
    displayName: "Kimi K2",
    description: "最新旗舰，能力强",
    contextLength: "128K",
  },
};

// ============ 意图分类 ============

export type IntentType =
  | "simple_chat"      // 简单闲聊
  | "rag_query"        // 知识库查询
  | "web_search"       // 联网搜索
  | "complex_reasoning" // 复杂推理
  | "code_analysis";   // 代码分析

/**
 * 意图 -> 模型映射
 * 
 * 路由策略：
 * - 简单闲聊 → DeepSeek Flash（快、便宜）
 * - RAG 问答 → Kimi 128K（长上下文处理检索结果）
 * - 联网搜索 → DeepSeek Flash（搜索结果不长）
 * - 复杂推理 → DeepSeek Pro（思考模式）
 * - 代码分析 → DeepSeek Pro（推理能力强）
 */
export const INTENT_MODEL_MAP: Record<IntentType, ModelType> = {
  simple_chat: "deepseek-flash",
  rag_query: "kimi-128k",
  web_search: "deepseek-flash",
  complex_reasoning: "deepseek-pro",
  code_analysis: "deepseek-pro",
};

// ============ 意图判断 ============

/**
 * 简单的规则判断意图
 * 后续可以升级为用小模型做分类
 */
export function classifyIntent(question: string): IntentType {
  const q = question.toLowerCase();

  // 复杂推理信号
  const complexSignals = [
    "为什么",
    "原理",
    "底层",
    "深入",
    "详细分析",
    "对比",
    "优缺点",
    "架构设计",
    "如何实现",
    "源码",
    "机制",
    "本质",
    "深度",
  ];

  // 代码分析信号
  const codeSignals = [
    "这段代码",
    "代码审查",
    "review",
    "bug",
    "报错",
    "优化这个",
    "重构",
    "```",
    "function",
    "const ",
    "import ",
  ];

  // 联网搜索信号
  const webSignals = [
    "搜索",
    "搜一下",
    "查一下",
    "最新",
    "现在",
    "目前",
    "今天",
    "天气",
    "新闻",
    "版本",
    "官网",
    "官方",
  ];

  // RAG 信号
  const ragSignals = [
    "博客",
    "笔记",
    "文章",
    "你写过",
    "你之前",
    "知识库",
    "总结过",
  ];

  // 简单闲聊信号
  const chatSignals = [
    "你好",
    "hi",
    "hello",
    "谢谢",
    "再见",
    "哈哈",
    "嗯",
    "好的",
  ];

  // 按优先级判断
  if (codeSignals.some((s) => q.includes(s))) {
    return "code_analysis";
  }

  if (complexSignals.some((s) => q.includes(s))) {
    return "complex_reasoning";
  }

  if (webSignals.some((s) => q.includes(s))) {
    return "web_search";
  }

  if (ragSignals.some((s) => q.includes(s))) {
    return "rag_query";
  }

  if (chatSignals.some((s) => q.includes(s))) {
    return "simple_chat";
  }

  // 默认用 flash 处理
  return "simple_chat";
}

// ============ 模型工厂 ============

/**
 * 创建 LLM 实例
 */
export function createLLM(
  modelType: ModelType,
  options: {
    bindTools?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools?: any[];
  } = {}
) {
  const config = MODEL_CONFIGS[modelType];
  const providerConfig = PROVIDER_CONFIGS[config.provider];

  const llm = new ChatOpenAI({
    model: config.model,
    apiKey: process.env[providerConfig.apiKeyEnv],
    configuration: {
      baseURL: providerConfig.baseURL,
    },
    temperature: 0,
    streaming: true,
    // DeepSeek Pro 思考模式
    ...(config.thinking && {
      modelKwargs: {
        thinking: config.thinking,
        reasoning_effort: config.reasoningEffort,
      },
    }),
  });

  if (options.bindTools && options.tools) {
    return llm.bindTools(options.tools);
  }

  return llm;
}

// 保持向后兼容的别名
export const createDeepSeekLLM = createLLM;

/**
 * 根据问题自动选择模型
 */
export function selectModel(
  question: string,
  options: {
    bindTools?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools?: any[];
  } = {}
): {
  llm: ReturnType<typeof createLLM>;
  intent: IntentType;
  modelType: ModelType;
  modelName: string;
  displayName: string;
} {
  const intent = classifyIntent(question);
  const modelType = INTENT_MODEL_MAP[intent];
  const config = MODEL_CONFIGS[modelType];

  return {
    llm: createLLM(modelType, options),
    intent,
    modelType,
    modelName: config.model,
    displayName: config.displayName,
  };
}

/**
 * 获取模型显示信息（用于前端展示）
 */
export function getModelDisplayInfo(modelType: ModelType) {
  const config = MODEL_CONFIGS[modelType];
  return {
    name: config.model,
    displayName: config.displayName,
    description: config.description,
    contextLength: config.contextLength,
    provider: config.provider,
  };
}
