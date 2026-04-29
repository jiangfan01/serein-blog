/**
 * 消息列表渲染
 *
 * 设计：无气泡，纯文本排版
 * 用户消息：粗体，右侧小标签
 * AI 消息：正常字重，左侧小圆点标识
 * 通过头像标识 + 间距区分角色，不用背景色块
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Bot } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { ToolCallList, ThinkingStatus } from "./tool-status";
import type { ChatMessage } from "@/hooks/use-chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  isFullscreen?: boolean;
  hideEmptyState?: boolean;
}

export function ChatMessages({
  messages,
  loading,
  hideEmptyState = false,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (messages.length === 0 && !hideEmptyState) {
    return <EmptyState />;
  }

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {messages.map((msg, i) => (
        <MessageRow
          key={i}
          message={msg}
          isLast={i === messages.length - 1}
          loading={loading}
          isNew={i === messages.length - 1 || i === messages.length - 2}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageRow({
  message,
  isLast,
  loading,
  isNew,
}: {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
  isNew?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className={`flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-200`}>
        <div className="max-w-[85%] md:max-w-[70%]">
          <div className="bg-[var(--surface-secondary)] rounded-2xl rounded-br-sm px-4 py-2.5">
            <p className="text-sm text-[var(--text-strong)] leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
      {/* AI 标识：描边小圆 */}
      <div className="w-6 h-6 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3 h-3 text-[var(--text-secondary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <AssistantContent
          message={message}
          isLast={isLast}
          loading={loading}
        />
      </div>
    </div>
  );
}

function AssistantContent({
  message,
  isLast,
  loading,
}: {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
}) {
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const hasContent = !!message.content;
  const isThinking = isLast && loading && !hasToolCalls && !hasContent;
  const hasRunningTool = message.toolCalls?.some((c) => c.status === "running");

  return (
    <>
      {/* 模型信息（显示在最上方） */}
      {message.model && <ModelBadge model={message.model} intent={message.intent} />}

      {/* 工具调用记录（始终展示，不会消失） */}
      {hasToolCalls && <ToolCallList records={message.toolCalls!} />}

      {/* 文本内容 */}
      {hasContent && (
        <div className="text-sm text-[var(--text-primary)] leading-relaxed">
          <MarkdownRenderer content={message.content} />
        </div>
      )}

      {/* 思考中（没有工具调用也没有内容时） */}
      {isThinking && <ThinkingStatus />}

      {/* 有工具在跑但还没出文本（等待模型第二次调用） */}
      {isLast && loading && hasRunningTool && !hasContent && null}
    </>
  );
}

/**
 * 模型信息徽章
 */
function ModelBadge({ model, intent }: { model: string; intent?: string }) {
  // 模型名称映射
  const modelLabels: Record<string, { label: string; color: "default" | "pro" | "kimi" }> = {
    "deepseek-v4-flash": { label: "DeepSeek Flash", color: "default" },
    "deepseek-v4-pro": { label: "DeepSeek Pro", color: "pro" },
    "moonshot-v1-8k": { label: "Kimi 8K", color: "kimi" },
    "moonshot-v1-32k": { label: "Kimi 32K", color: "kimi" },
    "moonshot-v1-128k": { label: "Kimi 128K", color: "kimi" },
    "kimi-k2-0711-preview": { label: "Kimi K2", color: "kimi" },
  };

  // 意图映射
  const intentLabels: Record<string, string> = {
    simple_chat: "闲聊",
    rag_query: "知识库",
    web_search: "联网",
    complex_reasoning: "深度推理",
    code_analysis: "代码分析",
  };

  const modelInfo = modelLabels[model] || { label: model, color: "default" as const };
  const intentLabel = intent ? intentLabels[intent] || intent : null;

  // 颜色样式
  const colorStyles = {
    default: "bg-[var(--surface-secondary)] text-[var(--text-tertiary)]",
    pro: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    kimi: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  const dotStyles = {
    default: "bg-[var(--text-quaternary)]",
    pro: "bg-amber-500",
    kimi: "bg-blue-500",
  };

  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide ${colorStyles[modelInfo.color]}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotStyles[modelInfo.color]}`}
        />
        {modelInfo.label}
      </span>
      {intentLabel && (
        <span className="text-[10px] text-[var(--text-quaternary)]">
          · {intentLabel}
        </span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" data-lenis-prevent>
      <div className="flex flex-col items-center justify-center h-full text-center gap-5">
        <div className="w-10 h-10 rounded-full border border-[var(--border-strong)] flex items-center justify-center">
          <Bot className="w-5 h-5 text-[var(--text-secondary)]" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-[var(--text-strong)]">
            Serein AI
          </p>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            知识库检索 · 联网搜索 · Agent 驱动
          </p>
        </div>
      </div>
    </div>
  );
}
