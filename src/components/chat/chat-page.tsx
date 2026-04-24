/**
 * AI Chat 全屏页面
 *
 * 布局：顶部导航条 + 居中对话区 + 底部输入框
 * 设计参考 ChatGPT / Claude 的沉浸式对话体验
 * 左侧 sidebar 预留给以后的 session 列表
 */
"use client";

import { useRef, useEffect } from "react";
import { Bot, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";

export function ChatPage() {
  const { messages, loading, sendMessage } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 新消息时滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-dvh flex flex-col bg-[var(--app-bg)]">
      {/* 顶部导航 */}
      <header className="flex-shrink-0 border-b border-[var(--border-subtle)] bg-[var(--app-bg)]/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-4 h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-strong)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">返回博客</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center">
              <Bot className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--text-strong)] leading-tight">
                Serein AI
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)] leading-tight">
                Agent 驱动
              </span>
            </div>
          </div>

          {/* 占位，保持标题居中 */}
          <div className="w-[72px]" />
        </div>
      </header>

      {/* 对话区域 */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen onSend={sendMessage} />
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            <ChatMessages messages={messages} loading={loading} isFullscreen hideEmptyState />
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] bg-[var(--app-bg)]">
        <div className="max-w-3xl mx-auto w-full px-4 py-4">
          <ChatInput onSend={sendMessage} disabled={loading} autoFocus />
          <p className="text-center text-[11px] text-[var(--text-tertiary)] mt-2.5">
            基于博客笔记 RAG 检索 · 支持联网搜索 · Kimi 驱动
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * 欢迎屏幕
 * 空状态时显示，带快捷提问按钮
 */
function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const suggestions = [
    { text: "React Fiber 架构是什么", icon: "⚛️" },
    { text: "Vue 和 React 更新机制有什么区别", icon: "🔄" },
    { text: "什么是 RAG 检索增强生成", icon: "🔍" },
    { text: "Agent 开发需要掌握哪些知识", icon: "🤖" },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
      <div className="flex flex-col items-center gap-6 max-w-lg">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-[var(--accent)]" />
        </div>

        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-strong)]">
            Serein AI
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            基于博客笔记的 AI 助手，支持知识库检索和联网搜索
          </p>
        </div>

        {/* 快捷提问 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-2">
          {suggestions.map((s) => (
            <button
              key={s.text}
              onClick={() => onSend(s.text)}
              className="group flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-strong)] transition-all text-left"
            >
              <span className="text-base leading-none mt-0.5">{s.icon}</span>
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-strong)] transition-colors leading-snug">
                {s.text}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
