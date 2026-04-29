/**
 * 会话侧边栏组件
 *
 * 设计原则：Absolute Sharpness + Monospace Hierarchy
 * - 极简终端风格，等宽字体层级
 * - Hash 符号代替聊天气泡（工程笔记语义）
 * - 左侧激活指示线
 * - 行内编辑/删除状态
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Trash2, Loader2, Check, X, PenLine, Hash } from "lucide-react";
import {
  useInfiniteSessions,
  useCreateSession,
  useDeleteSession,
  useUpdateSession,
} from "@/hooks/use-sessions";
import { useSessionStore } from "@/stores/session-store";
import { formatRelativeTime } from "@/lib/utils/format-time";
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

  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const updateSession = useUpdateSession();
  const { activeSessionId, setActiveSession, setSidebarOpen } = useSessionStore();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessions = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.sessions);
  }, [data]);

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

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession.mutateAsync();
      setActiveSession(newSession.id);
      onSessionChange?.(newSession.id);
      setSidebarOpen(false);
    } catch {
      toast.error("创建会话失败");
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSession(sessionId);
    onSessionChange?.(sessionId);
    setSidebarOpen(false);
    // 切换会话时，重置所有状态
    setEditingId(null);
    setDeleteConfirmId(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeleteConfirmId(null);

      if (sessionId === activeSessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          setActiveSession(remaining[0].id);
          onSessionChange?.(remaining[0].id);
        } else {
          setActiveSession(null);
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
    <div className="h-full flex flex-col bg-[var(--surface-secondary)] border-r border-[var(--border-subtle)] font-sans selection:bg-[var(--text-strong)] selection:text-[var(--app-bg)]">
      
      {/* 极简头部 & 新建按钮 */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-subtle)]">
        <button
          onClick={handleCreateSession}
          disabled={createSession.isPending}
          className="group w-full flex items-center justify-between h-10 px-4 rounded-md bg-[var(--surface)] border border-[var(--border-default)] hover:border-[var(--text-strong)] transition-colors disabled:opacity-50 shadow-sm hover:shadow-none"
        >
          <span className="text-[12px] font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-strong)] tracking-wide uppercase">
            New Thread
          </span>
          {createSession.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-tertiary)]" />
          ) : (
            <Plus className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-strong)] transition-colors" />
          )}
        </button>
      </div>

      {/* 列表标签 (仿终端风格) */}
      <div className="px-5 py-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-quaternary)]" />
        <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-[0.2em]">
          Session History
        </span>
      </div>

      {/* 列表滚动区 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 pb-4"
        data-lenis-prevent
      >
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-md bg-[var(--surface)] animate-pulse mx-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-10 text-center font-mono text-[11px] text-[var(--text-tertiary)] uppercase">
            Failed to load
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center font-mono text-[11px] text-[var(--text-tertiary)] uppercase">
            No history found
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                id={session.id}
                title={session.title}
                updatedAt={session.updatedAt}
                isActive={session.id === activeSessionId}
                isDeleting={deleteSession.isPending && deleteConfirmId === session.id}
                isUpdating={updateSession.isPending && editingId === session.id}
                showDeleteConfirm={deleteConfirmId === session.id}
                isEditing={editingId === session.id}
                onSelect={() => handleSelectSession(session.id)}
                onDeleteClick={() => setDeleteConfirmId(session.id)}
                onDeleteConfirm={() => handleDeleteSession(session.id)}
                onDeleteCancel={() => setDeleteConfirmId(null)}
                onEditClick={() => setEditingId(session.id)}
                onEditConfirm={(newTitle) => handleUpdateTitle(session.id, newTitle)}
                onEditCancel={() => setEditingId(null)}
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
// Session Item 组件
// ==========================================

interface SessionItemProps {
  id: string;
  title: string | null;
  updatedAt: string;
  isActive: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  showDeleteConfirm: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onEditClick: () => void;
  onEditConfirm: (newTitle: string) => void;
  onEditCancel: () => void;
}

function SessionItem({
  title,
  updatedAt,
  isActive,
  isDeleting,
  isUpdating,
  showDeleteConfirm,
  isEditing,
  onSelect,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onEditClick,
  onEditConfirm,
  onEditCancel,
}: SessionItemProps) {
  const displayTitle = title || "Untitled Session";
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

  // --- 状态 1: 确认删除 ---
  if (showDeleteConfirm) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 mx-1 my-1">
        <p className="text-[11px] font-mono text-red-600 dark:text-red-400 uppercase tracking-wide">
          Confirm Deletion?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onDeleteConfirm}
            disabled={isDeleting}
            className="flex-1 h-7 rounded bg-red-600 text-white text-[11px] font-semibold tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "..." : "YES"}
          </button>
          <button
            onClick={onDeleteCancel}
            className="flex-1 h-7 rounded bg-[var(--surface)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[11px] font-semibold tracking-wide hover:bg-[var(--surface-secondary)] transition-colors"
          >
            NO
          </button>
        </div>
      </div>
    );
  }

  // --- 状态 2: 编辑模式 ---
  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-md bg-[var(--surface)] border border-[var(--text-strong)] shadow-sm mx-1 my-1">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-[13px] font-medium text-[var(--text-strong)] bg-transparent border-b border-[var(--border-default)] pb-1 outline-none focus:border-[var(--text-strong)] transition-colors"
          maxLength={60}
          placeholder="Session name..."
        />
        <div className="flex justify-end gap-1 mt-1">
          <button
            onClick={onEditCancel}
            className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => editValue.trim() && onEditConfirm(editValue.trim())}
            disabled={isUpdating || !editValue.trim()}
            className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-strong)] transition-colors disabled:opacity-50"
          >
            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // --- 状态 3: 默认展示模式 ---
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-start gap-3 p-3 mx-1 my-0.5 rounded-md cursor-pointer transition-all duration-200 ${
        isActive
          ? "bg-[var(--surface)] shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
          : "hover:bg-[var(--surface)]"
      }`}
    >
      {/* 极简左侧激活线 */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3/5 bg-[var(--text-strong)] rounded-r-full" />
      )}

      {/* 采用 Hash (#) 符号代替气泡，更符合工程笔记/终端语义 */}
      <Hash
        className={`w-4 h-4 flex-shrink-0 mt-[2px] transition-colors ${
          isActive ? "text-[var(--text-strong)]" : "text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)]"
        }`}
        strokeWidth={2}
      />
      
      <div className="flex-1 min-w-0 pr-8">
        <p className={`text-[13px] leading-snug truncate transition-colors ${
          isActive ? "text-[var(--text-strong)] font-semibold" : "text-[var(--text-secondary)] font-medium group-hover:text-[var(--text-strong)]"
        }`}>
          {displayTitle}
        </p>
        <p className="font-mono text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-1">
          {formatRelativeTime(updatedAt)}
        </p>
      </div>

      {/* 悬浮操作按钮组 (绝对定位以防文字挤压) */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="p-1.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-secondary)] transition-all"
        >
          <PenLine className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="p-1.5 rounded text-[var(--text-tertiary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
