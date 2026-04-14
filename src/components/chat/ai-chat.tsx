"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, MessageSquare, Bot, User, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat() {
  const [open, setOpen] = useState(false);
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
    if (open) inputRef.current?.focus();
  }, [open]);

  // RAF 循环：每帧从 buffer 中取一批字符追加到消息中
  const startTypewriter = useCallback(() => {
    displayedRef.current = "";
    bufferRef.current = "";

    const tick = () => {
      const buf = bufferRef.current;
      const displayed = displayedRef.current;

      if (buf.length > displayed.length) {
        // 每帧吐 1~3 个字符，模拟打字节奏
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
    // 把剩余 buffer 全部刷出
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
              // 只往 buffer 追加，不触发 setState
              bufferRef.current += parsed.content;
            }
          } catch {
            // skip
          }
        }
      }
    } catch {
      if (!bufferRef.current) {
        bufferRef.current = "抱歉，请求出错了，请稍后再试。";
      }
    } finally {
      // 等 RAF 把剩余内容刷完
      setTimeout(() => {
        stopTypewriter();
        setLoading(false);
      }, 100);
    }
  };

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

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] flex flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--app-bg)] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-secondary)]/50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[var(--accent)]" />
          <span className="font-semibold text-sm text-[var(--text-strong)]">
            AI 助手
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            基于博客笔记 RAG
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-strong)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4" data-lenis-prevent>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <Bot className="w-10 h-10 text-[var(--accent)]/40" />
            <p className="text-sm text-[var(--text-tertiary)]">
              问我任何技术问题
              <br />
              我会从博客笔记中检索相关内容回答
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <Bot className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-1" />
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-[var(--accent)] text-white rounded-br-sm"
                  : "bg-[var(--surface-secondary)] text-[var(--text-strong)] rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.content ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  loading && i === messages.length - 1 && (
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
                  )
                )
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <User className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 mt-1" />
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
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] text-sm text-[var(--text-strong)] placeholder:text-[var(--text-tertiary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
