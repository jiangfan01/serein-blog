/**
 * 工具调用状态组件
 *
 * 根据不同工具类型显示不同的图标和样式
 * 带呼吸动画，让用户知道 Agent 正在工作
 */
"use client";

import { Search, Globe, Loader2 } from "lucide-react";

interface ToolStatusProps {
  status: string;
  tool?: string;
}

const TOOL_CONFIG: Record<string, { icon: typeof Search; label: string; color: string }> = {
  rag_search: {
    icon: Search,
    label: "博客笔记",
    color: "var(--accent)",
  },
  web_search: {
    icon: Globe,
    label: "互联网",
    color: "oklch(0.65 0.15 250)",
  },
};

export function ToolStatus({ status, tool }: ToolStatusProps) {
  const config = tool ? TOOL_CONFIG[tool] : null;
  const Icon = config?.icon || Loader2;

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center animate-pulse"
        style={{ backgroundColor: config ? `color-mix(in oklch, ${config.color} 15%, transparent)` : "var(--surface-tertiary)" }}
      >
        <Icon
          className="w-3.5 h-3.5"
          style={{ color: config?.color || "var(--text-tertiary)" }}
        />
      </div>
      <span className="text-xs text-[var(--text-secondary)]">
        {status}
      </span>
    </div>
  );
}

/**
 * 思考中状态组件
 * 三个点的脉冲动画
 */
export function ThinkingStatus() {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
            style={{
              animation: "thinking-pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-tertiary)]">思考中</span>
    </div>
  );
}
