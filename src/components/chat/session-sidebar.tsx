/**
 * 会话侧边栏组件
 *
 * 参考 ChatGPT 侧边栏设计
 * - 简洁干净，无多余装饰
 * - 新聊天按钮置顶
 * - 会话列表紧凑排列
 * - hover 显示操作按钮
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { SquarePen, Trash2, Loader2, Check, X, Pencil, MessageSquare } from "lucide-react";
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

  /**
   * 新聊天 = 跳转到 /chat（欢迎页）
   */
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
    <div className="h-full flex flex-col bg-[var(--surface-secondary)]">
      {/* 新聊天按钮 */}
      <div className="flex-shrink-0 p-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-[var(--surface)] transition-colors"
        >
          <SquarePen className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <span className="text-[14px] text-[var(--text-secondary)]">新聊天</span>
        </button>
      </div>

      {/* 会话列表 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 pb-2"
        data-lenis-prevent
      >
        {isLoading ? (
          <div className="space-y-1 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
            加载失败
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
            暂无聊天记录
          </div>
        ) : (
          <div className="space-y-0.5">
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
                animationDelay={index * 30}
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

// ==========================================
// Session Item
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

  // 删除确认
  if (showDeleteConfirm) {
    return (
      <div className="flex items-center gap-1 h-10 px-3 rounded-lg bg-[var(--surface)] animate-in fade-in duration-150">
        <span className="flex-1 text-[13px] text-[var(--text-secondary)] truncate">删除此对话？</span>
        <button
          onClick={onDeleteConfirm}
          disabled={isDeleting}
          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={onDeleteCancel}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 编辑模式
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 h-10 px-3 rounded-lg bg-[var(--surface)] animate-in fade-in duration-150">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 text-[13px] text-[var(--text-strong)] bg-transparent outline-none"
          maxLength={50}
        />
        <button
          onClick={() => editValue.trim() && onEditConfirm(editValue.trim())}
          disabled={isUpdating || !editValue.trim()}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-strong)] transition-colors disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button
          onClick={onEditCancel}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 默认状态
  const isRunning = replyStatus === "running";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      style={{ animationDelay: `${animationDelay}ms` }}
      className={`group relative flex items-center gap-2 h-10 px-3 rounded-lg cursor-pointer transition-all duration-150 animate-in fade-in slide-in-from-left-2 ${
        isActive
          ? "bg-[var(--surface)]"
          : "hover:bg-[var(--surface)]"
      }`}
    >
      {/* 图标：running 时显示动画，否则显示 MessageSquare */}
      {isRunning ? (
        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
        </span>
      ) : (
        <MessageSquare 
          className="w-4 h-4 flex-shrink-0 text-[var(--text-tertiary)]" 
          strokeWidth={1.5} 
        />
      )}
      <span className={`flex-1 text-[13px] truncate ${
        isActive ? "text-[var(--text-strong)]" : "text-[var(--text-secondary)]"
      }`}>
        {displayTitle}
      </span>
      
      {/* hover 操作按钮 */}
      <div className={`flex items-center gap-0.5 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="p-1.5 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
