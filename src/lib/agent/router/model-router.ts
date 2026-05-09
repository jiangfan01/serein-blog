/**
 * 模型路由器
 *
 * 从数据库读取路由规则，支持：
 * 1. 动态配置 - 不重启服务就能改路由
 * 2. 降级策略 - 主模型不可用时切备用
 * 3. 健康检查 - 记录模型可用性
 */
import { prisma } from "@/lib/prisma";
import type { RouterContext, RouteResult, IntentType } from "./types";

// 路由规则缓存
interface CachedRule {
  data: RouteResult;
  expiresAt: number;
}

const CACHE_TTL = 60 * 1000; // 1分钟缓存

/**
 * 模型路由器
 */
export class ModelRouter {
  private cache: Map<IntentType, CachedRule> = new Map();

  /**
   * 根据上下文选择模型
   */
  async route(context: RouterContext): Promise<RouteResult> {
    const { intent } = context;

    // 1. 检查缓存
    const cached = this.cache.get(intent);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // 2. 从数据库查询路由规则
    const rule = await prisma.routingRule.findFirst({
      where: {
        intentType: intent,
        enabled: true,
      },
      orderBy: {
        weight: "desc",
      },
      include: {
        model: {
          include: {
            provider: true,
          },
        },
        fallbackModel: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!rule) {
      // 没有匹配规则，使用默认模型
      return this.getDefaultRoute();
    }

    // 3. 构建路由结果
    const result: RouteResult = {
      modelId: rule.model.id,
      modelName: rule.model.modelName,
      displayName: rule.model.displayName,
      provider: rule.model.provider.name,
      baseUrl: rule.model.provider.baseUrl,
      apiKeyEnv: rule.model.provider.apiKeyEnv,
      extraParams: rule.model.extraParams as Record<string, unknown> | null,
      inputPrice: Number(rule.model.inputPrice),
      outputPrice: Number(rule.model.outputPrice),
      contextLength: rule.model.contextLength,
    };

    // 添加降级模型
    if (rule.fallbackModel) {
      result.fallback = {
        modelId: rule.fallbackModel.id,
        modelName: rule.fallbackModel.modelName,
        displayName: rule.fallbackModel.displayName,
        provider: rule.fallbackModel.provider.name,
        baseUrl: rule.fallbackModel.provider.baseUrl,
        apiKeyEnv: rule.fallbackModel.provider.apiKeyEnv,
        extraParams: rule.fallbackModel.extraParams as Record<
          string,
          unknown
        > | null,
        contextLength: rule.fallbackModel.contextLength,
      };
    }

    // 4. 更新缓存
    this.cache.set(intent, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return result;
  }

  /**
   * 获取默认路由（当没有匹配规则时）
   */
  private async getDefaultRoute(): Promise<RouteResult> {
    // 查询优先级最高的启用模型
    const model = await prisma.modelConfig.findFirst({
      where: { enabled: true },
      orderBy: { priority: "desc" },
      include: { provider: true },
    });

    if (!model) {
      throw new Error("没有可用的模型配置");
    }

    return {
      modelId: model.id,
      modelName: model.modelName,
      displayName: model.displayName,
      provider: model.provider.name,
      baseUrl: model.provider.baseUrl,
      apiKeyEnv: model.provider.apiKeyEnv,
      extraParams: model.extraParams as Record<string, unknown> | null,
      inputPrice: Number(model.inputPrice),
      outputPrice: Number(model.outputPrice),
      contextLength: model.contextLength,
    };
  }

  /**
   * 检查模型健康状态
   */
  async checkHealth(modelId: string): Promise<boolean> {
    // 查询最近的健康检查记录
    const recentCheck = await prisma.modelHealthCheck.findFirst({
      where: {
        modelId,
        checkedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5分钟内
        },
      },
      orderBy: { checkedAt: "desc" },
    });

    // 如果有最近的检查记录，返回其状态
    if (recentCheck) {
      return recentCheck.isHealthy;
    }

    // 没有记录，假设健康
    return true;
  }

  /**
   * 记录健康检查结果
   */
  async recordHealthCheck(
    modelId: string,
    isHealthy: boolean,
    latencyMs?: number,
    errorMessage?: string
  ) {
    await prisma.modelHealthCheck.create({
      data: {
        modelId,
        isHealthy,
        latencyMs,
        errorMessage,
      },
    });
  }

  /**
   * 清除缓存（配置更新时调用）
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取所有可用模型（用于管理界面）
   */
  async getAllModels() {
    return prisma.modelConfig.findMany({
      where: { enabled: true },
      include: { provider: true },
      orderBy: { priority: "desc" },
    });
  }

  /**
   * 获取所有路由规则（用于管理界面）
   */
  async getAllRules() {
    return prisma.routingRule.findMany({
      include: {
        model: true,
        fallbackModel: true,
      },
      orderBy: [{ intentType: "asc" }, { weight: "desc" }],
    });
  }
}

// 单例
let routerInstance: ModelRouter | null = null;

export function getModelRouter(): ModelRouter {
  if (!routerInstance) {
    routerInstance = new ModelRouter();
  }
  return routerInstance;
}
