/**
 * 企业级模型路由系统
 *
 * 核心功能：
 * 1. 意图分类 - 用小模型做分类，替代硬编码关键词
 * 2. 动态路由 - 从数据库读取路由规则，支持热更新
 * 3. 降级策略 - 主模型失败自动切备用
 * 4. 调用记录 - 记录 token、延迟、成本
 */

export { IntentClassifier } from "./intent-classifier";
export { ModelRouter } from "./model-router";
export { CallLogger } from "./call-logger";
export type { RouterContext, RouteResult, CallLogData } from "./types";
