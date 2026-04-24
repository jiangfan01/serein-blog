/**
 * 工具调用状态组件
 *
 * 两种状态：
 * - running：脉冲动画 + "正在搜索..."
 * - done：对勾 + "搜索完成" + 可展开结果摘要
 */
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { ToolCallRecord } from "@/hooks/use-chat";
import {
  getToolMeta,
  getToolQueryDescription,
  ToolResult,
} from "./tools/tool-renderers";

/**
 * 单条工具调用记录
 */
export function ToolCallItem({ record }: { record: ToolCallRecord }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(record.tool);
  const Icon = meta.icon;
  const isRunning = record.status === "running";
  const isError = record.status === "error";
  const canExpand = !isRunning && !!record.result;
  const description = getToolQueryDescription(record.args);
  const statusLabel = isRunning
    ? meta.runningLabel
    : isError
      ? `${meta.label}失败`
      : meta.doneLabel;

  return (
    <div className="group flex flex-col">
      <button
        onClick={() => canExpand && setExpanded((value) => !value)}
        disabled={!canExpand}
        className="flex w-fit max-w-full items-center gap-2 rounded-md py-1 pl-1 pr-3 text-left transition-colors hover:bg-[var(--surface-secondary)]/60 disabled:hover:bg-transparent"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {canExpand && expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          ) : canExpand ? (
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-quaternary)] transition-colors group-hover:text-[var(--text-secondary)]" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--border-strong)]" />
          )}
        </span>

        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {isRunning ? (
            <Icon className="h-3.5 w-3.5 animate-pulse text-[var(--text-secondary)]" strokeWidth={1.6} />
          ) : isError ? (
            <AlertCircle className="h-3.5 w-3.5 text-[var(--error,#e55)]" strokeWidth={1.7} />
          ) : (
            <Check className="h-3.5 w-3.5 text-[var(--text-secondary)]" strokeWidth={1.8} />
          )}
        </span>

        <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" strokeWidth={1.6} />

        <span className="shrink-0 font-mono text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          {meta.label}
        </span>

        <span className="hidden text-[10px] text-[var(--border-strong)] sm:inline">
          |
        </span>

        <span className="min-w-0 truncate font-mono text-[11px] text-[var(--text-tertiary)]">
          {description ?? statusLabel}
        </span>

        {isRunning && (
          <span className="ml-1 flex items-center gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-[var(--text-tertiary)]"
                style={{
                  animation: "thinking-pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && record.result && (
          <motion.div
            key="tool-result"
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-3 mt-1 border-l border-[var(--border-default)] py-1.5 pl-4">
              <div className="max-h-[300px] overflow-y-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/60 p-3">
                <ToolResult record={record} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 工具调用列表（渲染在 AI 消息内，文本内容之前）
 */
export function ToolCallList({ records }: { records: ToolCallRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="mb-3 flex flex-col gap-1.5">
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
