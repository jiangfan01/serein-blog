/**
 * Toast 通知组件
 *
 * 极简设计：小巧、克制、不打扰
 */
"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { Check, X, AlertCircle } from "lucide-react";

// ============================================================
// Types & Store
// ============================================================

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2, 9);
    const duration = toast.duration ?? 3000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id, duration }],
    }));

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
// Helper
// ============================================================

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: "success", message, duration: duration ?? 2500 }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: "error", message, duration: duration ?? 3500 }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: "info", message, duration: duration ?? 2500 }),
};

// ============================================================
// Components
// ============================================================

function ToastItem({ toast: t, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 150);
  };

  // 图标
  const Icon = t.type === "success" ? Check : t.type === "error" ? AlertCircle : null;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-[var(--text-strong)] text-[var(--app-bg)]
        text-[13px] font-medium
        shadow-lg
        transition-all duration-150
        ${isExiting ? "opacity-0 translate-y-1 scale-95" : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-2"}
      `}
      role="alert"
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={2} />}
      <span className="truncate max-w-[200px]">{t.message}</span>
      <button
        onClick={handleClose}
        className="p-0.5 rounded hover:bg-white/20 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/**
 * Toast 容器
 */
export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
