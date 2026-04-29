/**
 * 会话侧边栏组件 (Manus Premium Style)
 *
 * 设计精髓：
 * - 极致的呼吸感、高级的排版层级
 * - 玻璃质感（Glassmorphism）的悬浮操作项
 * - 纯 Typography 驱动，去除廉价 Icon
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Plus, Trash2, Loader2, Check, X, Pencil } from "lucide-react";
import {
  useInfiniteSessions,
  useDeleteSession,
  useUpdateSession,
  usePrefetchSessionMessages,
} from "@/hooks/use-sessions";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/components/ui/toast";

interface SessionSidebarProps {
  onSessionChange?: (sessionId: string) => void;
}

export function SessionSidebar({ onSessionChange }: SessionSidebarProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteSessions();

  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();
  const prefetchMessages = usePrefetchSessionMessages();
  const { setSidebarOpen } = useSessionStore();
  const pathname = usePathname();

  // 从 URL 读取当前会话 ID：/chat/[sessionId]
  const activeSessionId = useMemo(() => {
    const match = pathname.match(/^\/chat\/(.+)$/);
    return match ? match[1] : null;
  }, [pathname]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.sessions);
  }, [data]);

  // 无限滚动
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 100 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    onSessionChange?.(sessionId);
    setSidebarOpen(false);
    setEditingId(null);
    setDeleteConfirmId(null);
  };

  const handleNewChat = () => {
    onSessionChange?.("");
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeleteConfirmId(null);

      if (sessionId === activeSessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          onSessionChange?.(remaining[0].id);
        } else {
          onSessionChange?.("");
        }
      }
      toast.success("已删除");
    } catch {
      toast.error("删除失败");
    }
  };

  const handleUpdateTitle = async (sessionId: string, newTitle: string) => {
    try {
      await updateSession.mutateAsync({ id: sessionId, title: newTitle });
      setEditingId(null);
    } catch {
      toast.error("更新失败");
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--app-bg)] font-sans">
      
      {/* 顶部高定质感按钮 (Manus 风格) */}
      <div className="flex-shrink-0 p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-b from-[var(--surface)] to-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-2xl hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_2px_12px_rgba(255,255,255,0.02)] transition-all duration-200 active:scale-[0.98] group"
        >
          <span className="text-[13.5px] font-medium text-[var(--text-strong)] tracking-tight">
            新对话
          </span>
          <div className="w-6 h-6 rounded-full bg-[var(--text-strong)] text-[var(--app-bg)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
        </button>
      </div>

      {/* 极其克制的列表标题 */}
      <div className="px-5 pt-1 pb-3 flex items-center">
        <span className="text-[11px] font-semibold text-[var(--text-quaternary)] uppercase tracking-[0.15em]">
          历史记录
        </span>
      </div>

      {/* 会话列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 pb-4"
        style={{ scrollbarWidth: "none" }}
        data-lenis-prevent
      >
        {isLoading ? (
          <div className="space-y-1.5 px-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[38px] rounded-xl bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-[12px] font-medium text-[var(--text-tertiary)]">
            加载失败
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-[12px] font-medium text-[var(--text-tertiary)]">
            暂无聊天记录
          </div>
        ) : (
          <div className="space-y-0.5 relative">
            {sessions.map((session, index) => (
              <SessionItem
                key={session.id}
                id={session.id}
                title={session.title}
                replyStatus={session.replyStatus}
                isActive={session.id === activeSessionId}
                isDeleting={deleteSession.isPending && deleteConfirmId === session.id}
                isUpdating={updateSession.isPending && editingId === session.id}
                showDeleteConfirm={deleteConfirmId === session.id}
                isEditing={editingId === session.id}
                onSelect={() => handleSelectSession(session.id)}
                onMouseEnter={() => prefetchMessages(session.id)}
                onDeleteClick={() => setDeleteConfirmId(session.id)}
                onDeleteConfirm={() => handleDeleteSession(session.id)}
                onDeleteCancel={() => setDeleteConfirmId(null)}
                onEditClick={() => setEditingId(session.id)}
                onEditConfirm={(newTitle) => handleUpdateTitle(session.id, newTitle)}
                onEditCancel={() => setEditingId(null)}
                animationDelay={index * 20}
              />
            ))}
            {isFetchingNextPage && (
              <div className="py-4 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--text-quaternary)]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Session Item (Premium UI)
// ==========================================

interface SessionItemProps {
  id: string;
  title: string | null;
  replyStatus: string;
  isActive: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  showDeleteConfirm: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onEditClick: () => void;
  onEditConfirm: (newTitle: string) => void;
  onEditCancel: () => void;
  animationDelay?: number;
}

function SessionItem({
  title,
  replyStatus,
  isActive,
  isDeleting,
  isUpdating,
  showDeleteConfirm,
  isEditing,
  onSelect,
  onMouseEnter,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onEditClick,
  onEditConfirm,
  onEditCancel,
  animationDelay = 0,
}: SessionItemProps) {
  const displayTitle = title || "新对话";
  const [editValue, setEditValue] = useState(displayTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(displayTitle);
  }, [displayTitle, isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editValue.trim()) onEditConfirm(editValue.trim());
    } else if (e.key === "Escape") {
      onEditCancel();
    }
  };

  // 1. 删除确认状态 (优雅的内联警告)
  if (showDeleteConfirm) {
    return (
      <div className="flex items-center justify-between px-3 py-2 my-0.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 animate-in fade-in duration-200">
        <span className="text-[12px] font-medium text-red-600 dark:text-red-400">确认删除？</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDeleteCancel}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onDeleteConfirm}
            disabled={isDeleting}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "删除"}
          </button>
        </div>
      </div>
    );
  }

  // 2. 编辑模式 (极简输入框)
  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 my-0.5 rounded-xl bg-[var(--surface)] ring-1 ring-[var(--border-strong)] animate-in fade-in duration-200 shadow-sm">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 h-6 text-[13px] font-medium text-[var(--text-strong)] bg-transparent outline-none placeholder:text-[var(--text-quaternary)]"
          maxLength={60}
          placeholder="命名此对话..."
        />
        <div className="flex items-center gap-0.5">
          <button
            onClick={onEditCancel}
            className="p-1.5 rounded-md hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editValue.trim() && onEditConfirm(editValue.trim())}
            disabled={isUpdating || !editValue.trim()}
            className="p-1.5 rounded-md bg-[var(--text-strong)] text-[var(--app-bg)] hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" strokeWidth={3} />}
          </button>
        </div>
      </div>
    );
  }

  // 3. 默认展示状态 (无 Icon 干扰，纯文本排版 + 毛玻璃操作舱)
  const isRunning = replyStatus === "running";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={`group relative flex items-center h-[38px] px-3 my-0.5 rounded-xl cursor-pointer select-none transition-all duration-200 ease-out animate-in fade-in slide-in-from-left-1 ${
        isActive
          ? "bg-[var(--surface-secondary)]"
          : "hover:bg-[var(--surface)]"
      }`}
    >
      {/* 极简的 Running 指示器 */}
      {isRunning && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
      )}

      {/* 文本内容 */}
      <span className={`flex-1 text-[13px] truncate transition-colors duration-200 ${isRunning ? "ml-3" : ""} ${
        isActive ? "font-semibold text-[var(--text-strong)]" : "font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-strong)]"
      }`}>
        {displayTitle}
      </span>
      
      {/* 悬浮操作面板 (Glassmorphism Pill) */}
      <div 
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center p-0.5 rounded-lg bg-[var(--surface)]/80 backdrop-blur-md ring-1 ring-[var(--border-subtle)] shadow-sm transition-all duration-200 ease-out ${
          isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
