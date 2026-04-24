"use client";

import type { ReactNode } from "react";
import { BookOpen, Globe, Terminal, type LucideIcon } from "lucide-react";
import type { ToolCallRecord } from "@/hooks/use-chat";

type ToolMeta = {
  icon: LucideIcon;
  label: string;
  runningLabel: string;
  doneLabel: string;
};

type ToolRendererProps = {
  record: ToolCallRecord;
};

const TOOL_META: Record<string, ToolMeta> = {
  rag_search: {
    icon: BookOpen,
    label: "笔记检索",
    runningLabel: "正在检索博客笔记...",
    doneLabel: "博客笔记检索完成",
  },
  web_search: {
    icon: Globe,
    label: "联网搜索",
    runningLabel: "正在联网搜索...",
    doneLabel: "联网搜索完成",
  },
};

const TOOL_RENDERERS: Record<string, (props: ToolRendererProps) => ReactNode> = {
  rag_search: RagSearchResult,
  web_search: WebSearchResult,
};

export function getToolMeta(tool: string): ToolMeta {
  return (
    TOOL_META[tool] ?? {
      icon: Terminal,
      label: tool,
      runningLabel: `正在执行 ${tool}...`,
      doneLabel: `${tool} 执行完成`,
    }
  );
}

export function ToolResult({ record }: ToolRendererProps) {
  const Renderer = TOOL_RENDERERS[record.tool] ?? DefaultToolResult;

  return <Renderer record={record} />;
}

function RagSearchResult({ record }: ToolRendererProps) {
  return (
    <ToolOutputBlock title="命中笔记">
      <ResultText value={record.result} />
    </ToolOutputBlock>
  );
}

function WebSearchResult({ record }: ToolRendererProps) {
  return (
    <ToolOutputBlock title="搜索结果">
      <ResultText value={record.result} />
    </ToolOutputBlock>
  );
}

function DefaultToolResult({ record }: ToolRendererProps) {
  return (
    <ToolOutputBlock title="工具输出">
      <ResultText value={record.result} />
    </ToolOutputBlock>
  );
}

function ToolOutputBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-quaternary)]">
        <span>$</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ResultText({ value }: { value: string }) {
  return (
    <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-[var(--text-tertiary)]">
      {value || "暂无返回内容。"}
    </pre>
  );
}

export function getToolQueryDescription(args: Record<string, unknown>) {
  const query = args.query;

  if (typeof query === "string" && query.trim()) {
    return `查询：${query}`;
  }

  return undefined;
}
