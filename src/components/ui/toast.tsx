/**
 * Toast 通知组件
 *
 * 设计方向：精致的卡片式通知
 * - 毛玻璃背景
 * - 流畅的进入/退出动画
 * - 进度条显示剩余时间
 * - 支持多个 Toast 堆叠
 */
"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

// ============================================================
// Types
// ============================================================

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  createdAt: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "createdAt">) => void;
  removeToast: (id: string) => void;
}

// ============================================================
// Store
// ============================================================

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const createdAt = Date.now();
    const duration = toast.duration ?? 4000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, createdAt, duration }],
    }));

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// ============================================================
// Helper Functions
// ============================================================

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: "success", message, duration: duration ?? 4000 }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: "error", message, duration: duration ?? 5000 }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: "info", message, duration: duration ?? 4000 }),
};

// ============================================================
// Components
// ============================================================

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const STYLES = {
  success: {
    icon: "text-[var(--success)]",
    bg: "bg-[var(--success)]/5",
    border: "border-[var(--success)]/20",
    progress: "bg-[var(--success)]",
  },
  error: {
    icon: "text-[var(--danger)]",
    bg: "bg-[var(--danger)]/5",
    border: "border-[var(--danger)]/20",
    progress: "bg-[var(--danger)]",
  },
  info: {
    icon: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/5",
    border: "border-[var(--accent)]/20",
    progress: "bg-[var(--accent)]",
  },
};

function ToastItem({
  toast: t,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const Icon = ICONS[t.type];
  const styles = STYLES[t.type];
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  // 进度条动画
  useEffect(() => {
    if (t.duration <= 0) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - t.createdAt;
      const remaining = Math.max(0, 100 - (elapsed / t.duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [t.createdAt, t.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`
        relative flex items-start gap-3 px-4 py-3 rounded-xl
        bg-[var(--surface)] backdrop-blur-xl
        border ${styles.border}
        shadow-[var(--shadow-md)]
        transition-all duration-200 ease-[var(--ease-soft)]
        ${isExiting
          ? "opacity-0 translate-x-4 scale-95"
          : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-full fade-in duration-300"
        }
      `}
      role="alert"
    >
      {/* 图标 */}
      <div className={`flex-shrink-0 p-1 rounded-lg ${styles.bg}`}>
        <Icon className={`w-4 h-4 ${styles.icon}`} strokeWidth={2} />
      </div>

      {/* 内容 */}
      <p className="flex-1 text-[13px] text-[var(--text-primary)] leading-relaxed pr-6">
        {t.message}
      </p>

      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 rounded-md text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        aria-label="关闭"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* 进度条 */}
      {t.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border-subtle)] rounded-b-xl overflow-hidden">
          <div
            className={`h-full ${styles.progress} transition-all duration-100 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Toast 容器组件
 * 放在 layout 中，全局显示 Toast
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </div>
  );
}
