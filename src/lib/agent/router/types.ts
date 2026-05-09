/**
 * 路由系统类型定义
 */

export type IntentType =
  | "simple_chat"
  | "rag_query"
  | "web_search"
  | "complex_reasoning"
  | "code_analysis";

/**
 * 意图分类结果
 */
export interface IntentResult {
  intent: IntentType;
  confidence: number; // 0-1 置信度
  reasoning?: string; // 分类理由（调试用）
}

/**
 * 路由上下文 - 路由决策的输入
 */
export interface RouterContext {
  question: string;
  intent: IntentType;
  sessionId?: string;
  // 可扩展：用户等级、历史对话长度等
}

/**
 * 路由结果
 */
export interface RouteResult {
  modelId: string;
  modelName: string;
  displayName: string;
  provider: string;
  baseUrl: string;
  apiKeyEnv: string;
  extraParams: Record<string, unknown> | null;
  // 降级信息
  fallback?: {
    modelId: string;
    modelName: string;
    displayName: string;
    provider: string;
    baseUrl: string;
    apiKeyEnv: string;
    extraParams: Record<string, unknown> | null;
    contextLength?: number;
  };
  // 价格信息（用于成本计算）
  inputPrice: number;
  outputPrice: number;
  // 模型上下文长度（用于动态计算 token 预算）
  contextLength: number;
}

/**
 * 调用日志数据
 */
export interface CallLogData {
  modelId: string;
  sessionId?: string;
  intentType: IntentType;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
  firstTokenMs?: number;
  status: "success" | "error" | "timeout" | "fallback";
  errorMessage?: string;
  usedFallback: boolean;
  fallbackReason?: string;
  toolCalls?: Array<{
    tool: string;
    latencyMs: number;
  }>;
}

/**
 * 模型配置（从数据库读取）
 */
export interface ModelConfigData {
  id: string;
  modelId: string;
  modelName: string;
  displayName: string;
  inputPrice: number;
  outputPrice: number;
  extraParams: Record<string, unknown> | null;
  provider: {
    name: string;
    baseUrl: string;
    apiKeyEnv: string;
  };
}
