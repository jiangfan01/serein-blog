/**
 * 模型统计 API
 *
 * 提供模型使用统计数据
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7", 10);

    // 计算日期范围
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // 1. 获取所有模型配置
    const models = await prisma.modelConfig.findMany({
      where: { enabled: true },
      include: { provider: true },
      orderBy: { priority: "desc" },
    });

    // 2. 获取每日统计
    const dailyStats = await prisma.modelUsageStats.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy: { date: "desc" },
    });

    // 3. 获取最近调用记录
    const recentLogs = await prisma.modelCallLog.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        model: {
          select: {
            displayName: true,
            modelName: true,
          },
        },
      },
    });

    // 4. 获取路由规则
    const routingRules = await prisma.routingRule.findMany({
      where: { enabled: true },
      include: {
        model: { select: { displayName: true, modelName: true } },
        fallbackModel: { select: { displayName: true, modelName: true } },
      },
      orderBy: { intentType: "asc" },
    });

    // 5. 计算汇总统计
    const summary = {
      totalCalls: 0,
      successCalls: 0,
      errorCalls: 0,
      fallbackCalls: 0,
      totalTokens: BigInt(0),
      totalCost: 0,
    };

    for (const stat of dailyStats) {
      summary.totalCalls += stat.totalCalls;
      summary.successCalls += stat.successCalls;
      summary.errorCalls += stat.errorCalls;
      summary.fallbackCalls += stat.fallbackCalls;
      summary.totalTokens += stat.totalInputTokens + stat.totalOutputTokens;
      summary.totalCost += Number(stat.totalCost);
    }

    // 6. 按模型分组统计
    const modelStats = new Map<
      string,
      {
        modelId: string;
        displayName: string;
        calls: number;
        tokens: bigint;
        cost: number;
        avgLatency: number;
        latencyCount: number;
      }
    >();

    for (const stat of dailyStats) {
      const existing = modelStats.get(stat.modelId);
      if (existing) {
        existing.calls += stat.totalCalls;
        existing.tokens += stat.totalInputTokens + stat.totalOutputTokens;
        existing.cost += Number(stat.totalCost);
        if (stat.avgLatencyMs) {
          existing.avgLatency += stat.avgLatencyMs * stat.totalCalls;
          existing.latencyCount += stat.totalCalls;
        }
      } else {
        const model = models.find((m) => m.id === stat.modelId);
        modelStats.set(stat.modelId, {
          modelId: stat.modelId,
          displayName: model?.displayName || "Unknown",
          calls: stat.totalCalls,
          tokens: stat.totalInputTokens + stat.totalOutputTokens,
          cost: Number(stat.totalCost),
          avgLatency: stat.avgLatencyMs ? stat.avgLatencyMs * stat.totalCalls : 0,
          latencyCount: stat.avgLatencyMs ? stat.totalCalls : 0,
        });
      }
    }

    // 转换为数组并计算平均延迟
    const modelStatsArray = Array.from(modelStats.values()).map((s) => ({
      ...s,
      tokens: s.tokens.toString(),
      avgLatency: s.latencyCount > 0 ? Math.round(s.avgLatency / s.latencyCount) : 0,
    }));

    // 7. 按意图分组统计
    const intentStats = new Map<string, { calls: number; tokens: bigint }>();
    for (const log of recentLogs) {
      const existing = intentStats.get(log.intentType);
      if (existing) {
        existing.calls += 1;
        existing.tokens += BigInt(log.totalTokens);
      } else {
        intentStats.set(log.intentType, {
          calls: 1,
          tokens: BigInt(log.totalTokens),
        });
      }
    }

    const intentStatsArray = Array.from(intentStats.entries()).map(
      ([intent, data]) => ({
        intent,
        calls: data.calls,
        tokens: data.tokens.toString(),
      })
    );

    return Response.json({
      models: models.map((m) => ({
        id: m.id,
        modelId: m.modelId,
        modelName: m.modelName,
        displayName: m.displayName,
        provider: m.provider.name,
        inputPrice: Number(m.inputPrice),
        outputPrice: Number(m.outputPrice),
        capabilities: m.capabilities,
        enabled: m.enabled,
      })),
      routingRules: routingRules.map((r) => ({
        id: r.id,
        name: r.name,
        intentType: r.intentType,
        model: r.model.displayName,
        fallbackModel: r.fallbackModel?.displayName,
        weight: r.weight,
      })),
      summary: {
        ...summary,
        totalTokens: summary.totalTokens.toString(),
        successRate:
          summary.totalCalls > 0
            ? ((summary.successCalls / summary.totalCalls) * 100).toFixed(1)
            : "0",
      },
      modelStats: modelStatsArray,
      intentStats: intentStatsArray,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        model: log.model.displayName,
        intentType: log.intentType,
        inputTokens: log.inputTokens,
        outputTokens: log.outputTokens,
        cost: Number(log.cost).toFixed(6),
        latencyMs: log.latencyMs,
        status: log.status,
        usedFallback: log.usedFallback,
        createdAt: log.createdAt.toISOString(),
      })),
      days,
    });
  } catch (error) {
    console.error("[Model Stats API] Error:", error);
    return Response.json(
      { error: "获取统计数据失败" },
      { status: 500 }
    );
  }
}
