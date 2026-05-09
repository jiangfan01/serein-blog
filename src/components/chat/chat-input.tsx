/**
 * 聊天输入框
 *
 * 极简设计：微圆角、纯白背景、极浅边框
 * 发送按钮：黑底白箭头，小圆角
 * 暂停按钮：运行时显示，点击暂停当前执行
 * 支持多行输入，自动调整高度
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, LoaderCircle, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onPause?: () => void;
  disabled: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, onPause, disabled, autoFocus = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      // 最小 1 行，最大 6 行（约 144px）
      const maxHeight = 144;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, []);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    setInput("");
    // 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter 发送，Shift+Enter 换行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePause = () => {
    if (disabled && onPause) {
      onPause();
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div
      data-running={disabled}
      className="group flex flex-col gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] px-4 py-3 transition-colors focus-within:border-[var(--text-strong)] data-[running=true]:border-[var(--accent)] data-[running=true]:bg-[var(--surface)]"
    >
      {disabled && (
        <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--accent)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>AI 正在运行，等待工具与模型返回</span>
        </div>
      )}

      <div className="flex items-start gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "AI 正在处理当前问题..." : "输入你的问题..."}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-sm text-[var(--text-strong)] placeholder:text-[var(--text-tertiary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 py-1"
          style={{ minHeight: "32px", lineHeight: "24px" }}
        />
        {disabled && onPause ? (
          <button
            type="button"
            onClick={handlePause}
            aria-label="暂停"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--text-strong)] transition-all hover:opacity-80"
          >
            <Square className="h-3.5 w-3.5 fill-current text-[var(--app-bg)]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label={disabled ? "AI 正在运行" : "发送消息"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-35"
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
        )}
      </div>
    </div>
  );
}
