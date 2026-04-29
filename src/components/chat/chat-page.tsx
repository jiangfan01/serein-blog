/**
 * AI Chat 全屏页面
 *
 * 设计方向：黑白极简主义，终端/工作站风格
 * 无气泡、无彩色装饰，纯文本排版 + 极细边框 + 大量留白
 * 面向高级开发者的知识库工作台
 */
"use client";

import { useRef, useEffect } from "react";
import { ArrowLeft, Terminal, Cpu, Network, Library } from "lucide-react";
import Link from "next/link";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";

export function ChatPage() {
  const { messages, loading, sendMessage } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-dvh flex flex-col bg-[var(--app-bg)] font-sans">
      {/* 极简顶部导航 */}
      <header className="flex-shrink-0 border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-6 h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-strong)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">返回博客</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[13px] font-semibold text-[var(--text-strong)] tracking-wide uppercase">
              Serein Engine
            </span>
          </div>

          <div className="w-[72px]" />
        </div>
      </header>

      {/* 对话区域 */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto" data-lenis-prevent>
        {messages.length === 0 ? (
          <WelcomeScreen onSend={sendMessage} />
        ) : (
          <div className="max-w-3xl mx-auto w-full px-6 py-8">
            <ChatMessages
              messages={messages}
              loading={loading}
              isFullscreen
              hideEmptyState
            />
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto w-full px-6 py-4">
          <ChatInput onSend={sendMessage} disabled={loading} autoFocus />
          <div className="flex items-center justify-center gap-2 mt-3 text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase">
            <span>知识库检索</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>联网搜索</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>Kimi/DeepSeek 驱动</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 欢迎屏幕
 * 黑白极简，极细边框卡片，无彩色装饰
 */
function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const suggestions = [
    { text: "解析 React Fiber 渲染架构", icon: Cpu },
    { text: "对比 Vue 与 React 更新机制", icon: Library },
    { text: "探索 RAG 检索增强生成架构", icon: Network },
    { text: "构建本地 Agent 工作流", icon: Terminal },
  ];

  return (
    <div className="flex flex-col justify-center min-h-full px-6 py-12 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10 text-left">
        <h1 className="text-2xl font-semibold text-[var(--text-strong)] tracking-tight flex items-center gap-2">
          Serein{" "}
          <span className="text-[var(--text-tertiary)] font-normal">
            / Workspace
          </span>
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-2 font-medium">
          技术笔记知识库 · 联网搜索 · Agent 驱动
        </p>
      </div>

      {/* 快捷提问 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              onClick={() => onSend(s.text)}
              className="group flex flex-col items-start p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-strong)] transition-colors text-left"
            >
              <div className="mb-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-strong)] transition-colors">
                <Icon strokeWidth={1.5} className="w-5 h-5" />
              </div>
              <span className="text-[14px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-strong)] transition-colors">
                {s.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
