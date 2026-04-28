"use client";

/**
 * 模型统计页面
 *
 * 使用 TanStack Query 管理数据请求
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Layers,
  Route,
} from "lucide-react";

interface ModelStatsData {
  models: Array<{
    id: string;
    modelId: string;
    modelName: string;
    displayName: string;
    provider: string;
    inputPrice: number;
    outputPrice: number;
    capabilities: string[];
    enabled: boolean;
  }>;
  routingRules: Array<{
    id: string;
    name: string;
    intentType: string;
    model: string;
    fallbackModel?: string;
    weight: number;
  }>;
  summary: {
    totalCalls: number;
    successCalls: number;
    errorCalls: number;
    fallbackCalls: number;
    totalTokens: string;
    totalCost: number;
    successRate: string;
  };
  modelStats: Array<{
    modelId: string;
    displayName: string;
    calls: number;
    tokens: string;
    cost: number;
    avgLatency: number;
  }>;
  intentStats: Array<{
    intent: string;
    calls: number;
    tokens: string;
  }>;
  recentLogs: Array<{
    id: string;
    model: string;
    intentType: string;
    inputTokens: number;
    outputTokens: number;
    cost: string;
    latencyMs: number;
    status: string;
    usedFallback: boolean;
    createdAt: string;
  }>;
  days: number;
}

const INTENT_LABELS: Record<string, string> = {
  simple_chat: "闲聊",
  rag_query: "知识库",
  web_search: "联网",
  complex_reasoning: "推理",
  code_analysis: "代码",
};

// API 请求函数
async function fetchModelStats(days: number): Promise<ModelStatsData> {
  const res = await fetch(`/api/model-stats?days=${days}`);
  if (!res.ok) throw new Error("获取数据失败");
  return res.json();
}

export function ModelStatsClient() {
  const [days, setDays] = useState(7);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["model-stats", days],
    queryFn: () => fetchModelStats(days),
    staleTime: 30 * 1000, // 30秒内不重新请求
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            {error instanceof Error ? error.message : "加载失败"}
          </p>
          <button
            onClick={() => refetch()}
            className="editorial-button"
            data-fill="left"
            data-size="compact"
          >
            <span className="editorial-button-label">重试</span>
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="py-12 px-6 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <h1 className="text-[var(--font-size-h2)] font-semibold text-[var(--text-strong)] leading-tight">
                模型统计
              </h1>
              <p className="mt-2 text-[var(--text-tertiary)]">
                最近 {days} 天的 AI 模型使用数据
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-10 px-4 bg-[var(--surface)] border border-[var(--border-default)] rounded-full text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value={1}>1 天</option>
                <option value={7}>7 天</option>
                <option value={30}>30 天</option>
              </select>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-10 w-10 flex items-center justify-center bg-[var(--surface)] border border-[var(--border-default)] rounded-full text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Summary Stats */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="总调用"
              value={data.summary.totalCalls.toLocaleString()}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              label="成功率"
              value={`${data.summary.successRate}%`}
              icon={<CheckCircle className="w-4 h-4" />}
              accent={Number(data.summary.successRate) >= 95}
            />
            <MetricCard
              label="Token 消耗"
              value={formatTokens(data.summary.totalTokens)}
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              label="总成本"
              value={`¥${data.summary.totalCost.toFixed(4)}`}
              icon={<ArrowUpRight className="w-4 h-4" />}
            />
          </div>
        </motion.section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Model Usage */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionHeader icon={<Layers className="w-4 h-4" />} title="模型使用" />
            <div className="mt-4 space-y-2">
              {data.modelStats.length === 0 ? (
                <EmptyState text="暂无使用数据" />
              ) : (
                data.modelStats.map((stat, i) => (
                  <ModelStatRow key={stat.modelId} stat={stat} index={i} />
                ))
              )}
            </div>
          </motion.section>

          {/* Intent Distribution */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionHeader icon={<Route className="w-4 h-4" />} title="意图分布" />
            <div className="mt-4 space-y-2">
              {data.intentStats.length === 0 ? (
                <EmptyState text="暂无数据" />
              ) : (
                data.intentStats.map((stat, i) => (
                  <IntentStatRow
                    key={stat.intent}
                    stat={stat}
                    index={i}
                    total={data.summary.totalCalls}
                  />
                ))
              )}
            </div>
          </motion.section>
        </div>

        {/* Routing Rules */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <SectionHeader icon={<Route className="w-4 h-4" />} title="路由规则" />
          <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border-subtle)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-secondary)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    意图
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">
                    主模型
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)] hidden sm:table-cell">
                    降级模型
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.routingRules.map((rule, i) => (
                  <tr
                    key={rule.id}
                    className={
                      i !== data.routingRules.length - 1
                        ? "border-b border-[var(--border-subtle)]"
                        : ""
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 bg-[var(--surface-secondary)] rounded text-xs font-medium text-[var(--text-secondary)]">
                        {INTENT_LABELS[rule.intentType] || rule.intentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-primary)]">{rule.model}</td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)] hidden sm:table-cell">
                      {rule.fallbackModel || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Recent Logs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionHeader icon={<Clock className="w-4 h-4" />} title="最近调用" />
          <div className="mt-4">
            {data.recentLogs.length === 0 ? (
              <EmptyState text="暂无调用记录" />
            ) : (
              <div className="space-y-2">
                {data.recentLogs.slice(0, 20).map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="p-5 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span className={accent ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}>
          {icon}
        </span>
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={`text-2xl font-semibold ${accent ? "text-[var(--accent)]" : "text-[var(--text-strong)]"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--text-tertiary)]">{icon}</span>
      <h2 className="text-lg font-semibold text-[var(--text-strong)]">{title}</h2>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">{text}</div>
  );
}

function ModelStatRow({
  stat,
  index,
}: {
  stat: ModelStatsData["modelStats"][0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl"
    >
      <div>
        <p className="font-medium text-[var(--text-primary)]">{stat.displayName}</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {stat.calls} 次 · {formatTokens(stat.tokens)} tokens · {stat.avgLatency}ms
        </p>
      </div>
      <p className="font-mono text-sm text-[var(--text-secondary)]">
        ¥{stat.cost.toFixed(4)}
      </p>
    </motion.div>
  );
}

function IntentStatRow({
  stat,
  index,
  total,
}: {
  stat: ModelStatsData["intentStats"][0];
  index: number;
  total: number;
}) {
  const percentage = total > 0 ? (stat.calls / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="p-4 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {INTENT_LABELS[stat.intent] || stat.intent}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          {stat.calls} 次 ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-1.5 bg-[var(--surface-secondary)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
          className="h-full bg-[var(--accent)] rounded-full"
        />
      </div>
    </motion.div>
  );
}

function LogRow({ log }: { log: ModelStatsData["recentLogs"][0] }) {
  const statusIcon =
    {
      success: <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />,
      error: <XCircle className="w-3.5 h-3.5 text-[var(--danger)]" />,
      timeout: <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)]" />,
      fallback: <AlertTriangle className="w-3.5 h-3.5 text-[var(--warning)]" />,
    }[log.status] || <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />;

  return (
    <div className="flex items-center gap-4 p-3 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-sm">
      <span className="flex-shrink-0">{statusIcon}</span>
      <span className="flex-shrink-0 w-24 truncate text-[var(--text-primary)]">
        {log.model}
      </span>
      <span className="flex-shrink-0 px-2 py-0.5 bg-[var(--surface-secondary)] rounded text-xs text-[var(--text-tertiary)]">
        {INTENT_LABELS[log.intentType] || log.intentType}
      </span>
      <span className="flex-1 text-[var(--text-tertiary)] font-mono text-xs hidden sm:block">
        {log.inputTokens + log.outputTokens} tokens
      </span>
      <span className="flex-shrink-0 text-[var(--text-tertiary)] font-mono text-xs">
        {log.latencyMs}ms
      </span>
      <span className="flex-shrink-0 text-[var(--text-quaternary)] text-xs hidden md:block">
        {formatTime(log.createdAt)}
      </span>
    </div>
  );
}

function formatTokens(tokens: string): string {
  const num = BigInt(tokens);
  if (num >= BigInt(1000000)) return `${(Number(num) / 1000000).toFixed(1)}M`;
  if (num >= BigInt(1000)) return `${(Number(num) / 1000).toFixed(1)}K`;
  return tokens;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
