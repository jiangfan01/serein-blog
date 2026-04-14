"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  X,
  MessageSquare,
  Bot,
  User,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 打字机：buffer 收集 + RAF 批量刷新
  const bufferRef = useRef("");
  const rafIdRef = useRef<number>(0);
  const displayedRef = useRef("");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open || fullscreen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, fullscreen]);

  const startTypewriter = useCallback(() => {
    displayedRef.current = "";
    bufferRef.current = "";
    const tick = () => {
      const buf = bufferRef.current;
      const displayed = displayedRef.current;
      if (buf.length > displayed.length) {
        const charsPerFrame = Math.min(3, buf.length - displayed.length);
        const next = buf.slice(0, displayed.length + charsPerFrame);
        displayedRef.current = next;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: next };
          }
          return updated;
        });
      }
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTypewriter = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    const final = bufferRef.current;
    if (final && final !== displayedRef.current) {
      displayedRef.current = final;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: final };
        }
        return updated;
      });
    }
  }, []);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ]);
    setLoading(true);
    startTypewriter();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error("请求失败");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("无法读取响应");
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              bufferRef.current += parsed.content;
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      if (!bufferRef.current) {
        bufferRef.current = "抱歉，请求出错了，请稍后再试。";
      }
    } finally {
      setTimeout(() => {
        stopTypewriter();
        setLoading(false);
      }, 100);
    }
  };

  // 消息列表 + 输入框（共享 UI）
  const chatBody = (isFullscreen: boolean) => (
    <>
      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        data-lenis-prevent
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center">
              <Bot className="w-8 h-8 text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-base font-medium text-[var(--text-strong)] mb-1">
                Serein AI 助手
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                基于博客笔记的 RAG 知识库检索
                <br />
                问我任何技术问题
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-[var(--accent)]" />
              </div>
            )}
            <div
              className={`${isFullscreen ? "max-w-[70%]" : "max-w-[80%]"} px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-md"
                  : "bg-[var(--surface-secondary)] text-[var(--text-strong)] rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.content ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  loading &&
                  i === messages.length - 1 && (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
                      <span className="text-xs text-[var(--text-tertiary)]">
                        思考中...
                      </span>
                    </div>
                  )
                )
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-[var(--text-strong)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--border-default)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入你的问题..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface-secondary)] text-sm text-[var(--text-strong)] placeholder:text-[var(--text-tertiary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );

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
                    基于博客笔记 RAG
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
            {chatBody(true)}
          </DialogContent>
        </Dialog>
        {/* 保留底部按钮 */}
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
          <span className="text-xs text-[var(--text-tertiary)]">RAG</span>
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
      {chatBody(false)}
    </div>
  );
}
