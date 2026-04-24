/**
 * 工具调用状态组件
 *
 * 两种状态：
 * - running：脉冲动画 + "正在搜索..."
 * - done：对勾 + "搜索完成" + 可展开结果摘要
 */
"use client";

import { useState } from "react";
import { Search, Globe, Check, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import type { ToolCallRecord } from "@/hooks/use-chat";

const TOOL_CONFIG: Record<string, { icon: typeof Search; label: string }> = {
  rag_search: { icon: Search, label: "博客笔记检索" },
  web_search: { icon: Globe, label: "联网搜索" },
};

/**
 * 单条工具调用记录
 */
export function ToolCallItem({ record }: { record: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false);
  const config = TOOL_CONFIG[record.tool];
  const Icon = config?.icon || Search;
  const label = config?.label || record.tool;
  const isRunning = record.status === "running";
  const isError = record.status === "error";

  return (
    <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
      {/* 头部 */}
      <button
        onClick={() => !isRunning && setExpanded(!expanded)}
        disabled={isRunning}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[var(--surface-secondary)] transition-colors disabled:hover:bg-transparent"
      >
        {/* 状态图标 */}
        <div
          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
            isRunning ? "animate-pulse" : ""
          }`}
          style={{
            border: `1px solid ${isRunning ? "var(--border-strong)" : isError ? "var(--error, #e55)" : "var(--accent)"}`,
          }}
        >
          {isRunning ? (
            <Icon className="w-3 h-3 text-[var(--text-secondary)]" strokeWidth={1.5} />
          ) : isError ? (
            <AlertCircle className="w-3 h-3 text-[var(--error, #e55)]" strokeWidth={1.5} />
          ) : (
            <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={2} />
          )}
        </div>

        {/* 文字 */}
        <span className="text-xs font-medium text-[var(--text-secondary)] flex-1">
          {isRunning ? `正在${label}...` : `${label}完成`}
        </span>

        {/* 展开箭头 */}
        {!isRunning && record.result && (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          )
        )}
      </button>

      {/* 展开的结果摘要 */}
      {expanded && record.result && (
        <div className="px-3 py-2 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
          <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed whitespace-pre-wrap break-words">
            {record.result}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * 工具调用列表（渲染在 AI 消息内，文本内容之前）
 */
export function ToolCallList({ records }: { records: ToolCallRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mb-3">
      {records.map((record, i) => (
        <ToolCallItem key={`${record.tool}-${i}`} record={record} />
      ))}
    </div>
  );
}

/**
 * 思考中状态
 */
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
