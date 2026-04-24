/**
 * AI 聊天壳组件
 *
 * 职责：只负责布局和窗口状态（小窗 / 全屏 / 关闭）
 * 不包含任何业务逻辑、状态管理、SSE 解析
 *
 * 拆分前：一个文件 300+ 行，混合了布局、状态、SSE 解析、打字机、渲染
 * 拆分后：
 *   - ai-chat.tsx（这个文件）→ 布局壳
 *   - hooks/use-chat.ts → 消息状态 + 发送逻辑 + 打字机
 *   - hooks/use-sse-parser.ts → SSE 流解析 + 事件分发
 *   - chat/chat-messages.tsx → 消息列表渲染
 *   - chat/chat-input.tsx → 输入框
 *   - chat/tool-status.tsx → 工具调用状态
 */
"use client";

import { useState } from "react";
import {
  X,
  MessageSquare,
  Bot,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { messages, loading, sendMessage } = useChat();

  // 全屏 Dialog 模式
  if (fullscreen) {
    return (
      <>
        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="max-w-3xl w-[90vw] h-[85vh] p-0 flex flex-col gap-0 rounded-2xl bg-[var(--app-bg)] border-[var(--border-default)] backdrop-blur-xl [&>button]:hidden">
            <VisuallyHidden.Root>
              <DialogTitle>AI 助手</DialogTitle>
            </VisuallyHidden.Root>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-[var(--text-strong)]">
                    AI 助手
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] ml-2">
                    Agent · RAG + 联网搜索
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFullscreen(false)}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-secondary)] transition-colors"
                  title="缩小"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setFullscreen(false);
                    setOpen(false);
                  }}
                  className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-secondary)] transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <ChatMessages messages={messages} loading={loading} isFullscreen />
            <ChatInput onSend={sendMessage} disabled={loading} autoFocus />
          </DialogContent>
        </Dialog>
        <button
          onClick={() => setFullscreen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="打开 AI 助手"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      </>
    );
  }

  // 关闭状态：浮动按钮
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--accent)] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label="打开 AI 助手"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  // 小窗模式
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--app-bg)] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-secondary)]/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <span className="font-semibold text-sm text-[var(--text-strong)]">
            AI 助手
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">Agent</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              setOpen(false);
              setFullscreen(true);
            }}
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-secondary)] transition-colors"
            title="全屏"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-secondary)] transition-colors"
            title="关闭"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <ChatMessages messages={messages} loading={loading} />
      <ChatInput onSend={sendMessage} disabled={loading} autoFocus={open} />
    </div>
  );
}
