/**
 * 聊天输入框组件
 *
 * 职责单一：输入框 + 发送按钮
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

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

  return (
    <div className="px-4 py-3 border-t border-[var(--border-default)]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--surface-secondary)] text-sm text-[var(--text-strong)] placeholder:text-[var(--text-tertiary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
