/**
 * 聊天输入框
 *
 * 极简设计：微圆角、纯白背景、极浅边框
 * 发送按钮：黑底白箭头，小圆角
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, disabled, autoFocus = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    setInput("");
    onSend(trimmed);
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <form
      onSubmit={handleSubmit}
      data-running={disabled}
      className="group flex flex-col gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] px-4 py-3 transition-colors focus-within:border-[var(--text-strong)] data-[running=true]:border-[var(--accent)] data-[running=true]:bg-[var(--surface)]"
    >
      {disabled && (
        <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--accent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>AI 正在运行，等待工具与模型返回</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "AI 正在处理当前问题..." : "输入你的问题..."}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-tertiary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label={disabled ? "AI 正在运行" : "发送消息"}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-35"
          style={{
            backgroundColor: canSend ? "var(--text-strong)" : "var(--border-default)",
          }}
        >
          {disabled ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
          ) : (
            <ArrowUp
              className="h-4 w-4"
              style={{ color: canSend ? "var(--app-bg)" : "var(--text-tertiary)" }}
            />
          )}
        </button>
      </div>
    </form>
  );
}
