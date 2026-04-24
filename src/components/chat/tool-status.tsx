/**
 * 工具调用状态 + 思考中状态
 *
 * 黑白极简风格，无彩色装饰
 * 工具图标用描边风格，状态文字用 uppercase 小字
 */
"use client";

import { Search, Globe, Loader2 } from "lucide-react";

interface ToolStatusProps {
  status: string;
  tool?: string;
}

const TOOL_CONFIG: Record<string, { icon: typeof Search; label: string }> = {
  rag_search: { icon: Search, label: "RAG" },
  web_search: { icon: Globe, label: "WEB" },
};

export function ToolStatus({ status, tool }: ToolStatusProps) {
  const config = tool ? TOOL_CONFIG[tool] : null;
  const Icon = config?.icon || Loader2;

  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="w-5 h-5 rounded border border-[var(--border-strong)] flex items-center justify-center animate-pulse">
        <Icon className="w-3 h-3 text-[var(--text-secondary)]" strokeWidth={1.5} />
      </div>
      <span className="text-xs text-[var(--text-tertiary)] font-medium tracking-wide">
        {status}
      </span>
    </div>
  );
}

export function ThinkingStatus() {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]"
            style={{
              animation: "thinking-pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span className="text-xs text-[var(--text-tertiary)] font-medium tracking-wide">
        思考中
      </span>
    </div>
  );
}
