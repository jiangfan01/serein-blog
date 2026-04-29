/**
 * 会话侧边栏组件 (Manus Premium Style)
 *
 * 参考 Manus 设计：
 * - 顶部 Logo + 折叠按钮
 * - 新建任务按钮（高亮）
 * - 可折叠的历史记录区域
 * - 底部品牌信息
 */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { 
  SquarePen, 
  Trash2, 
  Loader2, 
  Check, 
  X, 
  Pencil,
  ChevronDown,
  Sparkles,
  PanelLeftClose
} from "lucide-react";
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
  onCollapse?: () => void;
}

export function SessionSidebar({ onSessionChange, onCollapse }: SessionSidebarProps) {
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

  // 从 URL 读取当前会话 ID
  const activeSessionId = useMemo(() => {
    const match = pathname.match(/^\/chat\/(.+)$/);
    return match ? match[1] : null;
  }, [pathname]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);
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
    <div className="h-full flex flex-col bg-[var(--surface-secondary)]">
      
      {/* ========== 顶部区域：Logo + 折叠 ========== */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--text-strong)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--app-bg)]" strokeWidth={2} />
            </div>
            <span className="text-[15px] font-semibold text-[var(--text-strong)] tracking-tight">
              Serein
            </span>
          </div>
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ========== 新建对话按钮 (Vercel 风格：黑白灰) ========== */}
      <div className="flex-shrink-0 px-3 py-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--text-strong)] hover:opacity-90 transition-all duration-150 group"
        >
          <SquarePen className="w-4 h-4 text-[var(--app-bg)]" strokeWidth={1.8} />
          <span className="text-[13px] font-medium text-[var(--app-bg)]">
            新建对话
          </span>
        </button>
      </div>

      {/* ========== 历史记录区域（可折叠） ========== */}
      <div className="flex-1 flex flex-col min-h-0 px-3 pt-4 overflow-hidden">
        {/* 折叠标题 */}
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="flex items-center justify-between px-1 pb-2 group"
        >
          <span className="text-[11px] font-semibold text-[var(--text-quaternary)] uppercase tracking-[0.1em]">
            历史记录
          </span>
          <div className="flex items-center gap-1.5">
            {sessions.length > 0 && (
              <span className="text-[10px] text-[var(--text-quaternary)] tabular-nums">
                {sessions.length}
              </span>
            )}
            <ChevronDown 
              className={`w-3.5 h-3.5 text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)] transition-all duration-200 ${
                historyExpanded ? "" : "-rotate-90"
              }`} 
            />
          </div>
        </button>

        {/* 会话列表（带折叠动画） */}
        <div 
          className={`flex-1 overflow-hidden transition-all duration-200 ease-out ${
            historyExpanded ? "opacity-100" : "opacity-0 max-h-0"
          }`}
        >
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto -mx-1 px-1"
            style={{ scrollbarWidth: "none" }}
            data-lenis-prevent
          >
            {isLoading ? (
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 rounded-lg bg-[var(--surface)] animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="py-8 text-center text-[12px] text-[var(--text-tertiary)]">
                加载失败
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-[var(--text-tertiary)]">
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
                    animationDelay={index * 20}
                  />
                ))}
                {isFetchingNextPage && (
                  <div className="py-3 flex justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--text-quaternary)]" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== 底部品牌信息 ========== */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[var(--text-quaternary)] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-[var(--surface)]" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-medium text-[var(--text-quaternary)]">
            from Serein
          </span>
        </div>
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
      <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 animate-in fade-in duration-150">
        <span className="text-[12px] font-medium text-red-600 dark:text-red-400">确认删除？</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDeleteCancel}
            className="px-2 py-1 rounded text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors"
          >
            取消
          </button>
          <button
            onClick={onDeleteConfirm}
            disabled={isDeleting}
            className="px-2 py-1 rounded text-[11px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "删除"}
          </button>
        </div>
      </div>
    );
  }

  // 编辑模式
  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--surface)] ring-1 ring-[var(--border-default)] animate-in fade-in duration-150">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 text-[12px] text-[var(--text-strong)] bg-transparent outline-none"
          maxLength={50}
        />
        <button
          onClick={onEditCancel}
          className="p-1 rounded text-[var(--text-tertiary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editValue.trim() && onEditConfirm(editValue.trim())}
          disabled={isUpdating || !editValue.trim()}
          className="p-1 rounded bg-[var(--text-strong)] text-[var(--app-bg)] disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" strokeWidth={2.5} />}
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
      className={`group relative flex items-center gap-2 h-9 px-2.5 rounded-lg cursor-pointer transition-all duration-150 animate-in fade-in slide-in-from-left-1 ${
        isActive
          ? "bg-[var(--surface)]"
          : "hover:bg-[var(--surface)]/60"
      }`}
    >
      {/* Running 指示器 */}
      {isRunning && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse flex-shrink-0" />
      )}

      {/* 标题 */}
      <span className={`flex-1 text-[12.5px] truncate ${
        isActive 
          ? "font-medium text-[var(--text-strong)]" 
          : "text-[var(--text-secondary)] group-hover:text-[var(--text-strong)]"
      } transition-colors`}>
        {displayTitle}
      </span>
      
      {/* 悬浮操作 */}
      <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${
        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditClick();
          }}
          className="p-1 rounded text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <Pencil className="w-3 h-3" strokeWidth={1.5} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteClick();
          }}
          className="p-1 rounded text-[var(--text-quaternary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
