/**
 * 消息列表渲染组件
 *
 * 设计决策：
 * - 用户消息右对齐，accent 背景，简洁
 * - AI 消息左对齐，surface 背景，宽松呼吸感
 * - 工具状态和思考状态内联在 AI 消息气泡内
 * - 全屏模式消息居中，最大宽度限制保证可读性
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { ToolStatus, ThinkingStatus } from "./tool-status";
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
  isFullscreen = false,
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
    <div
      className="flex-1 overflow-y-auto px-4 py-5 space-y-5"
      data-lenis-prevent
    >
      {isFullscreen && (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-5">
          {messages.map((msg, i) => (
            <MessageRow
              key={i}
              message={msg}
              isLast={i === messages.length - 1}
              loading={loading}
              wide
            />
          ))}
        </div>
      )}

      {!isFullscreen &&
        messages.map((msg, i) => (
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
  wide = false,
}: {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
  wide?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-2.5">
        <div
          className={`${wide ? "max-w-[65ch]" : "max-w-[85%]"} px-4 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed bg-[var(--accent)] text-white`}
        >
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-lg bg-[var(--text-strong)]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
      </div>
      <div
        className={`${wide ? "max-w-[65ch]" : "max-w-[88%]"} px-4 py-3 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-[var(--surface-secondary)] text-[var(--text-strong)]`}
      >
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
  if (message.content) {
    return <MarkdownRenderer content={message.content} />;
  }

  if (isLast && loading) {
    if (message.toolStatus) {
      return <ToolStatus status={message.toolStatus} tool={message.toolName} />;
    }
    return <ThinkingStatus />;
  }

  return null;
}

function EmptyState() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4" data-lenis-prevent>
      <div className="flex flex-col items-center justify-center h-full text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
          <Bot className="w-7 h-7 text-[var(--accent)]" />
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
