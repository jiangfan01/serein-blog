/**
 * 调用日志记录器
 *
 * 记录每次模型调用的详细信息：
 * - Token 统计
 * - 延迟指标
 * - 成本计算
 * - 错误信息
 */
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CallLogData, IntentType } from "./types";

/**
 * 调用日志记录器
 */
export class CallLogger {
  /**
   * 记录一次调用
   */
  async log(data: CallLogData): Promise<string> {
    const log = await prisma.modelCallLog.create({
      data: {
        modelId: data.modelId,
        sessionId: data.sessionId,
        intentType: data.intentType,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens: data.totalTokens,
        cost: new Prisma.Decimal(data.cost),
        latencyMs: data.latencyMs,
        firstTokenMs: data.firstTokenMs,
        status: data.status,
        errorMessage: data.errorMessage,
        usedFallback: data.usedFallback,
        fallbackReason: data.fallbackReason,
        toolCalls: data.toolCalls,
      },
    });

    // 异步更新统计（不阻塞主流程）
    this.updateStats(data).catch(console.error);

    return log.id;
  }

  /**
   * 更新每日统计
   */
  private async updateStats(data: CallLogData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.modelUsageStats.upsert({
      where: {
        modelId_date: {
          modelId: data.modelId,
          date: today,
        },
      },
      update: {
        totalCalls: { increment: 1 },
        successCalls:
          data.status === "success" ? { increment: 1 } : undefined,
        errorCalls: data.status === "error" ? { increment: 1 } : undefined,
        fallbackCalls: data.usedFallback ? { increment: 1 } : undefined,
        totalInputTokens: { increment: data.inputTokens },
        totalOutputTokens: { increment: data.outputTokens },
        totalCost: { increment: new Prisma.Decimal(data.cost) },
      },
      create: {
        modelId: data.modelId,
        date: today,
        totalCalls: 1,
        successCalls: data.status === "success" ? 1 : 0,
        errorCalls: data.status === "error" ? 1 : 0,
        fallbackCalls: data.usedFallback ? 1 : 0,
        totalInputTokens: BigInt(data.inputTokens),
        totalOutputTokens: BigInt(data.outputTokens),
        totalCost: new Prisma.Decimal(data.cost),
      },
    });
  }

  /**
   * 计算成本
   */
  calculateCost(
    inputTokens: number,
    outputTokens: number,
    inputPrice: number,
    outputPrice: number
  ): number {
    // 价格单位是 元/千token
    return (inputTokens * inputPrice + outputTokens * outputPrice) / 1000;
  }

  /**
   * 获取今日统计
   */
  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.modelUsageStats.findMany({
      where: { date: today },
    });
  }

  /**
   * 获取指定时间范围的统计
   */
  async getStats(startDate: Date, endDate: Date) {
    return prisma.modelUsageStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
    });
  }

  /**
   * 获取最近的调用记录
   */
  async getRecentLogs(limit = 100) {
    return prisma.modelCallLog.findMany({
      take: limit,
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
  }

  /**
   * 获取指定会话的调用记录
   */
  async getSessionLogs(sessionId: string) {
    return prisma.modelCallLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      include: {
        model: {
          select: {
            displayName: true,
            modelName: true,
          },
        },
      },
    });
  }

  /**
   * 获取错误统计
   */
  async getErrorStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.modelCallLog.groupBy({
      by: ["modelId", "status"],
      where: {
        createdAt: { gte: startDate },
        status: { not: "success" },
      },
      _count: true,
    });
  }

  /**
   * 获取延迟统计
   */
  async getLatencyStats(modelId: string, hours = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const logs = await prisma.modelCallLog.findMany({
      where: {
        modelId,
        createdAt: { gte: startTime },
        status: "success",
      },
      select: {
        latencyMs: true,
        firstTokenMs: true,
      },
      orderBy: { latencyMs: "asc" },
    });

    if (logs.length === 0) {
      return null;
    }

    const latencies = logs.map((l: { latencyMs: number }) => l.latencyMs);
    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    return {
      count: logs.length,
      avg: Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length),
      p50: latencies[p50Index],
      p95: latencies[p95Index],
      p99: latencies[p99Index],
      min: latencies[0],
      max: latencies[latencies.length - 1],
    };
  }
}

// 单例
let loggerInstance: CallLogger | null = null;

export function getCallLogger(): CallLogger {
  if (!loggerInstance) {
    loggerInstance = new CallLogger();
  }
  return loggerInstance;
}
