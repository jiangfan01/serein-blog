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
}: {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex gap-3">
        {/* 用户标识：实心小圆 */}
        <div className="w-6 h-6 rounded-full bg-[var(--text-strong)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-[var(--app-bg)]">U</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-strong)] leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
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
