/**
 * 会话侧边栏组件
 *
 * 简洁设计，专注功能
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Plus, Trash2, MessageSquare, Loader2, Pencil, Check, X } from "lucide-react";
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
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeleteConfirmId(null);

      if (sessionId === activeSessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          // 切换到第一个剩余会话
          setActiveSession(remaining[0].id);
          onSessionChange?.(remaining[0].id);
        } else {
          // 没有剩余会话，清空 activeSession
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
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex-shrink-0 p-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={handleCreateSession}
          disabled={createSession.isPending}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--text-strong)] text-[var(--app-bg)] text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {createSession.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>新对话</span>
        </button>
      </div>

      {/* 列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        data-lenis-prevent
      >
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-[var(--surface-secondary)] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-[13px] text-[var(--text-tertiary)]">
            加载失败
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-[var(--text-tertiary)]">
            暂无对话
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
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
              <div className="py-3 flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const displayTitle = title || "新对话";
  const [editValue, setEditValue] = useState(displayTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // 进入编辑模式时聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 重置编辑值
  useEffect(() => {
    setEditValue(displayTitle);
  }, [displayTitle, isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (editValue.trim()) {
        onEditConfirm(editValue.trim());
      }
    } else if (e.key === "Escape") {
      onEditCancel();
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="p-2.5 rounded-lg bg-[var(--surface-secondary)]">
        <p className="text-[12px] text-[var(--text-secondary)] mb-2">删除此对话？</p>
        <div className="flex gap-2">
          <button
            onClick={onDeleteConfirm}
            disabled={isDeleting}
            className="flex-1 h-7 rounded text-[12px] font-medium bg-[var(--danger)] text-white disabled:opacity-50"
          >
            {isDeleting ? "..." : "删除"}
          </button>
          <button
            onClick={onDeleteCancel}
            className="flex-1 h-7 rounded text-[12px] font-medium bg-[var(--surface)] text-[var(--text-secondary)]"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--surface)]">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 h-7 px-2 text-[13px] bg-[var(--surface-secondary)] border border-[var(--border-default)] rounded text-[var(--text-strong)] outline-none focus:border-[var(--accent)]"
          maxLength={100}
        />
        <button
          onClick={() => editValue.trim() && onEditConfirm(editValue.trim())}
          disabled={isUpdating || !editValue.trim()}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--accent)] disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onEditCancel}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? "bg-[var(--surface)]"
          : "hover:bg-[var(--surface-secondary)]"
      }`}
    >
      <MessageSquare
        className={`w-4 h-4 flex-shrink-0 ${
          isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
        }`}
        strokeWidth={1.5}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] truncate ${
          isActive ? "text-[var(--text-strong)] font-medium" : "text-[var(--text-secondary)]"
        }`}>
          {displayTitle}
        </p>
        <p className="text-[11px] text-[var(--text-quaternary)]">
          {formatRelativeTime(updatedAt)}
        </p>
      </div>
      {/* 操作按钮 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="p-1 rounded hover:bg-[var(--surface-tertiary)] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="p-1 rounded hover:bg-[var(--surface-tertiary)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] hover:text-[var(--danger)]" />
        </button>
      </div>
    </div>
  );
}
