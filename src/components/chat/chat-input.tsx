/**
 * 聊天输入框
 *
 * 极简设计：微圆角、纯白背景、极浅边框
 * 发送按钮：黑底白箭头，小圆角
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

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
      className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] focus-within:border-[var(--text-strong)] transition-colors"
    >
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything..."
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-tertiary)] focus:outline-none disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!canSend}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-20"
        style={{
          backgroundColor: canSend ? "var(--text-strong)" : "var(--border-default)",
        }}
      >
        <ArrowUp
          className="w-4 h-4"
          style={{ color: canSend ? "var(--app-bg)" : "var(--text-tertiary)" }}
        />
      </button>
    </form>
  );
}
