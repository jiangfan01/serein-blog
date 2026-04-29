/**
 * 会话侧边栏组件
 *
 * 设计方向：终端/工作站风格的精致极简主义
 * - 单色调配色，强调层次感
 * - 精细的边框和阴影
 * - 流畅的微交互动画
 * - 等宽字体点缀，增加技术感
 */
"use client";

import { useState } from "react";
import { Plus, Trash2, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { useSessions, useCreateSession, useDeleteSession } from "@/hooks/use-sessions";
import { useSessionStore } from "@/stores/session-store";
import { formatRelativeTime } from "@/lib/utils/format-time";
import { toast } from "@/components/ui/toast";

interface SessionSidebarProps {
  /** 会话切换回调 */
  onSessionChange?: (sessionId: string) => void;
}

export function SessionSidebar({ onSessionChange }: SessionSidebarProps) {
  const { data: sessions, isLoading, isError } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const { activeSessionId, setActiveSession, setSidebarOpen } = useSessionStore();

  // 删除确认状态
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /**
   * 创建新会话
   */
  const handleCreateSession = async () => {
    try {
      const newSession = await createSession.mutateAsync();
      setActiveSession(newSession.id);
      onSessionChange?.(newSession.id);
      setSidebarOpen(false);
    } catch (error) {
      console.error("创建会话失败:", error);
      toast.error("创建会话失败，请重试");
    }
  };

  /**
   * 切换会话
   */
  const handleSelectSession = (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSession(sessionId);
    onSessionChange?.(sessionId);
    setSidebarOpen(false);
  };

  /**
   * 删除会话
   */
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      setDeleteConfirmId(null);

      if (sessionId === activeSessionId) {
        const remaining = sessions?.filter((s) => s.id !== sessionId) || [];
        if (remaining.length > 0) {
          setActiveSession(remaining[0].id);
          onSessionChange?.(remaining[0].id);
        } else {
          handleCreateSession();
        }
      }

      toast.success("会话已删除");
    } catch (error) {
      console.error("删除会话失败:", error);
      toast.error("删除会话失败，请重试");
    }
  };

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      {/* 头部：品牌 + 新建按钮 */}
      <div className="flex-shrink-0 p-4 border-b border-[var(--border-subtle)]">
        {/* 品牌标识 */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--app-bg)] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-[var(--text-strong)] tracking-tight">
              Serein
            </span>
            <span className="text-[10px] font-mono text-[var(--text-quaternary)] uppercase tracking-wider">
              Workspace
            </span>
          </div>
        </div>

        {/* 新建按钮 */}
        <button
          onClick={handleCreateSession}
          disabled={createSession.isPending}
          className="group relative w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-[var(--border-default)] bg-transparent text-[13px] font-medium text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] ease-[var(--ease-soft)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          {/* 悬停时的背景动画 */}
          <span className="absolute inset-0 bg-gradient-to-r from-[var(--accent-soft)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <span className="relative flex items-center gap-2">
            {createSession.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
            )}
            <span>新建对话</span>
          </span>
        </button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        {/* 列表标题 */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-mono text-[var(--text-quaternary)] uppercase tracking-widest">
            对话历史
          </span>
          {sessions && sessions.length > 0 && (
            <span className="text-[10px] font-mono text-[var(--text-quaternary)] tabular-nums">
              {sessions.length}
            </span>
          )}
        </div>

        <div className="px-2 pb-4">
          {isLoading ? (
            <SessionListSkeleton />
          ) : isError ? (
            <ErrorState />
          ) : !sessions || sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1">
              {sessions.map((session, index) => (
                <SessionItem
                  key={session.id}
                  id={session.id}
                  title={session.title}
                  updatedAt={session.updatedAt}
                  isActive={session.id === activeSessionId}
                  isDeleting={deleteSession.isPending && deleteConfirmId === session.id}
                  showDeleteConfirm={deleteConfirmId === session.id}
                  index={index}
                  onSelect={() => handleSelectSession(session.id)}
                  onDeleteClick={() => setDeleteConfirmId(session.id)}
                  onDeleteConfirm={() => handleDeleteSession(session.id)}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部装饰 */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-quaternary)]">
          <span className="uppercase tracking-wider">Agent v1.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>在线</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 单个会话项
 */
interface SessionItemProps {
  id: string;
  title: string | null;
  updatedAt: string;
  isActive: boolean;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  index: number;
  onSelect: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

function SessionItem({
  title,
  updatedAt,
  isActive,
  isDeleting,
  showDeleteConfirm,
  index,
  onSelect,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: SessionItemProps) {
  const displayTitle = title || "新对话";

  // 删除确认状态
  if (showDeleteConfirm) {
    return (
      <div 
        className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-3 animate-in fade-in slide-in-from-left-2 duration-200"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <p className="text-[12px] text-[var(--text-secondary)] mb-3">
          确定删除这个对话吗？此操作不可撤销。
        </p>
        <div className="flex gap-2">
          <button
            onClick={onDeleteConfirm}
            disabled={isDeleting}
            className="flex-1 h-8 rounded-md text-[12px] font-medium bg-[var(--danger)] text-white hover:bg-[var(--danger)]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>删除中</span>
              </>
            ) : (
              <span>确认删除</span>
            )}
          </button>
          <button
            onClick={onDeleteCancel}
            disabled={isDeleting}
            className="flex-1 h-8 rounded-md text-[12px] font-medium border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--text-strong)] hover:text-[var(--text-strong)] transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`
        group relative flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer
        transition-all duration-[var(--duration-fast)] ease-[var(--ease-soft)]
        animate-in fade-in slide-in-from-left-2
        ${isActive
          ? "bg-[var(--surface)] shadow-[var(--shadow-soft)] border border-[var(--border-default)]"
          : "hover:bg-[var(--surface-secondary)] border border-transparent"
        }
      `}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* 活跃指示器 */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-[var(--accent)]" />
      )}

      {/* 图标 */}
      <div
        className={`
          relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
          transition-colors duration-[var(--duration-fast)]
          ${isActive
            ? "bg-[var(--accent-soft)]"
            : "bg-[var(--surface-secondary)] group-hover:bg-[var(--surface-tertiary)]"
          }
        `}
      >
        <MessageSquare
          className={`w-4 h-4 transition-colors duration-[var(--duration-fast)] ${
            isActive ? "text-[var(--accent)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
          }`}
          strokeWidth={1.5}
        />
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 py-0.5">
        <p
          className={`text-[13px] font-medium truncate leading-tight transition-colors duration-[var(--duration-fast)] ${
            isActive ? "text-[var(--text-strong)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-strong)]"
          }`}
        >
          {displayTitle}
        </p>
        <p className="text-[11px] font-mono text-[var(--text-quaternary)] mt-1 tabular-nums">
          {formatRelativeTime(updatedAt)}
        </p>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteClick();
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-[var(--danger)]/10 transition-all duration-[var(--duration-fast)]"
        aria-label="删除对话"
      >
        <Trash2 className="w-3.5 h-3.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors" />
      </button>
    </div>
  );
}

/**
 * 加载状态 Skeleton
 */
function SessionListSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg px-3 py-2.5 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--surface-secondary)]" />
          <div className="flex-1 py-0.5">
            <div className="h-4 w-3/4 rounded bg-[var(--surface-secondary)]" />
            <div className="h-3 w-1/3 rounded bg-[var(--surface-secondary)] mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 空状态
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
        <MessageSquare className="w-6 h-6 text-[var(--text-quaternary)]" strokeWidth={1.5} />
      </div>
      <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">
        暂无对话
      </p>
      <p className="text-[11px] text-[var(--text-quaternary)]">
        点击上方按钮开始新对话
      </p>
    </div>
  );
}

/**
 * 错误状态
 */
function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--danger)]/10 flex items-center justify-center mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-[13px] font-medium text-[var(--danger)] mb-1">
        加载失败
      </p>
      <p className="text-[11px] text-[var(--text-quaternary)]">
        请刷新页面重试
      </p>
    </div>
  );
}
