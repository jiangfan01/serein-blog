/**
 * 消息列表渲染组件
 *
 * 对应你上家架构的：渲染层（StreamEventRenderer）
 * 根据消息类型路由到不同的渲染方式
 *
 * 职责单一：只负责渲染消息列表，不管状态和逻辑
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { Bot, User, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { ToolStatus } from "./tool-status";
import type { ChatMessage } from "@/hooks/use-chat";

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
  isFullscreen?: boolean;
}

export function ChatMessages({
  messages,
  loading,
  isFullscreen = false,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 空状态
  if (messages.length === 0) {
    return (
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        data-lenis-prevent
      >
        <div className="flex flex-col items-center justify-center h-full text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-base font-medium text-[var(--text-strong)] mb-1">
              Serein AI 助手
            </p>
            <p className="text-sm text-[var(--text-tertiary)]">
              基于博客笔记的 AI Agent
              <br />
              支持知识库检索和联网搜索
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      data-lenis-prevent
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {/* AI 头像 */}
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-[var(--accent)]" />
            </div>
          )}

          {/* 消息气泡 */}
          <div
            className={`${isFullscreen ? "max-w-[80%]" : "max-w-[85%]"} px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-[var(--accent)] text-white rounded-br-md"
                : "bg-[var(--surface-secondary)] text-[var(--text-strong)] rounded-bl-md"
            }`}
          >
            {msg.role === "assistant" ? (
              <AssistantContent
                message={msg}
                isLast={i === messages.length - 1}
                loading={loading}
              />
            ) : (
              msg.content
            )}
          </div>

          {/* 用户头像 */}
          {msg.role === "user" && (
            <div className="w-7 h-7 rounded-lg bg-[var(--text-strong)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <User className="w-4 h-4 text-[var(--text-secondary)]" />
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * AI 消息内容渲染
 *
 * 三种状态：
 * 1. 有内容 → 渲染 Markdown
 * 2. 无内容 + 有工具状态 → 显示工具调用中
 * 3. 无内容 + 无工具状态 + loading → 显示思考中
 */
function AssistantContent({
  message,
  isLast,
  loading,
}: {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
}) {
  // 有内容，渲染 Markdown
  if (message.content) {
    return <MarkdownRenderer content={message.content} />;
  }

  // 最后一条消息 + loading 状态
  if (isLast && loading) {
    // 有工具状态，显示工具调用
    if (message.toolStatus) {
      return <ToolStatus status={message.toolStatus} />;
    }

    // 默认显示思考中
    return (
      <div className="flex items-center gap-2 py-1">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-tertiary)]">思考中...</span>
      </div>
    );
  }

  return null;
}
