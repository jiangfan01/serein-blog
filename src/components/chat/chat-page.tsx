/**
 * AI Chat 全屏页面
 *
 * 设计方向：黑白极简主义，终端/工作站风格
 * 无气泡、无彩色装饰，纯文本排版 + 极细边框 + 大量留白
 * 面向高级开发者的知识库工作台
 *
 * 多会话支持：
 * - 左侧会话列表侧边栏
 * - 会话切换、新建、删除
 * - URL query parameter 同步 (?session=xxx)
 * - 发送首条消息时自动创建会话（懒创建）
 */
"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Terminal, Cpu, Network, Library, Lock, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { MobileSidebarDrawer, MobileMenuButton } from "./mobile-sidebar-drawer";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";
import { useInfiniteSessions, useSessionMessages, useCreateSession, useOptimisticUpdateTitle } from "@/hooks/use-sessions";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/components/ui/toast";

export function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get("session");

  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const { data: sessionsData, isFetched } = useInfiniteSessions();
  const createSession = useCreateSession();
  const optimisticUpdateTitle = useOptimisticUpdateTitle();
  const { activeSessionId, setActiveSession } = useSessionStore();

  // 扁平化所有页的会话
  const sessions = sessionsData?.pages.flatMap((page) => page.sessions) ?? [];
  const hasNoSessions = isFetched && sessions.length === 0;

  const { messages, loading, sendMessage, loadHistory, clearMessages } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 获取当前会话的历史消息
  const { data: historyMessages, isLoading: messagesLoading } = useSessionMessages(activeSessionId);

  // 初始化标记 - 用 ref 避免 Strict Mode 重复执行
  const initRef = useRef(false);
  const [initialized, setInitialized] = useState(false);

  /**
   * 初始化会话
   * 1. 如果 URL 有 session 参数，使用它
   * 2. 如果没有，使用会话列表的第一个
   * 3. 如果没有会话，不创建，等用户发送消息时再创建
   */
  useEffect(() => {
    // 防止重复执行
    if (initRef.current || !isAuthenticated || !isFetched || initialized) return;
    initRef.current = true;

    // URL 有 session 参数
    if (urlSessionId) {
      // 验证这个 session 是否存在于列表中
      const exists = sessions.some((s) => s.id === urlSessionId);
      if (exists) {
        setActiveSession(urlSessionId);
        setInitialized(true);
        return;
      } else {
        // 会话不存在，清除 URL 参数
        router.replace("/chat");
      }
    }

    // 使用列表第一个会话
    if (sessions.length > 0) {
      const firstSession = sessions[0];
      setActiveSession(firstSession.id);
      router.replace(`/chat?session=${firstSession.id}`);
      setInitialized(true);
      return;
    }

    // 没有会话，不创建，显示欢迎页
    setActiveSession(null);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isFetched]);

  /**
   * 加载历史消息
   */
  useEffect(() => {
    if (historyMessages) {
      loadHistory(historyMessages);
    }
  }, [historyMessages, loadHistory]);

  /**
   * 会话切换处理
   */
  const handleSessionChange = useCallback(
    (sessionId: string) => {
      clearMessages();
      if (sessionId) {
        router.push(`/chat?session=${sessionId}`);
      } else {
        // 没有会话了，清除 URL 参数
        router.replace("/chat");
      }
    },
    [clearMessages, router]
  );

  /**
   * 发送消息
   * 如果没有会话，先创建会话再发送
   * 如果当前会话没有标题，乐观更新侧边栏
   */
  const handleSendMessage = useCallback(
    async (question: string) => {
      let sessionId = activeSessionId;

      // 没有会话，先创建
      if (!sessionId) {
        try {
          const newSession = await createSession.mutateAsync();
          sessionId = newSession.id;
          setActiveSession(sessionId);
          router.replace(`/chat?session=${sessionId}`);
          
          // 新会话，乐观更新标题
          const newTitle = question.trim().slice(0, 50) + (question.trim().length > 50 ? "..." : "");
          optimisticUpdateTitle(sessionId, newTitle);
        } catch (error) {
          console.error("创建会话失败:", error);
          toast.error("创建会话失败");
          return;
        }
      } else {
        // 检查当前会话是否有标题，没有则乐观更新
        const currentSession = sessions.find((s) => s.id === sessionId);
        if (currentSession && !currentSession.title) {
          const newTitle = question.trim().slice(0, 50) + (question.trim().length > 50 ? "..." : "");
          optimisticUpdateTitle(sessionId, newTitle);
        }
      }

      sendMessage(question, sessionId);
    },
    [activeSessionId, sessions, createSession, setActiveSession, router, optimisticUpdateTitle, sendMessage]
  );

  // 滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 认证加载中
  if (authLoading) {
    return <LoadingScreen />;
  }

  // 未登录 → 显示登录提示
  if (!isAuthenticated) {
    return <LoginRequiredScreen />;
  }

  // 会话加载中
  if (!isFetched || !initialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-dvh flex bg-[var(--app-bg)] font-sans">
      {/* 侧边栏 */}
      <MobileSidebarDrawer onSessionChange={handleSessionChange} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 极简顶部导航 */}
        <header className="flex-shrink-0 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            {/* 左侧：移动端菜单 + 返回按钮 */}
            <div className="flex items-center gap-2">
              <MobileMenuButton />
              <Link
                href="/"
                className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-strong)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[13px] font-medium hidden sm:inline">返回博客</span>
              </Link>
            </div>

            {/* 中间：Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[13px] font-semibold text-[var(--text-strong)] tracking-wide uppercase">
                Serein Engine
              </span>
            </div>

            {/* 右侧：用户菜单 */}
            <UserMenu user={user} onLogout={logout} />
          </div>
        </header>

        {/* 对话区域 */}
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto" data-lenis-prevent>
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px]">加载中...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <WelcomeScreen onSend={handleSendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-8">
              <ChatMessages
                messages={messages}
                loading={loading}
                isFullscreen
                hideEmptyState
              />
            </div>
          )}
        </div>

        {/* 底部输入区 */}
        <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
          <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-4">
            <ChatInput onSend={handleSendMessage} disabled={loading || createSession.isPending} autoFocus />
            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase">
              <span>知识库检索</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
              <span>联网搜索</span>
              <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
              <span>Kimi/DeepSeek 驱动</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 欢迎屏幕
 * 黑白极简，极细边框卡片，无彩色装饰
 */
function WelcomeScreen({ onSend }: { onSend: (msg: string) => void }) {
  const suggestions = [
    { text: "解析 React Fiber 渲染架构", icon: Cpu },
    { text: "对比 Vue 与 React 更新机制", icon: Library },
    { text: "探索 RAG 检索增强生成架构", icon: Network },
    { text: "构建本地 Agent 工作流", icon: Terminal },
  ];

  return (
    <div className="flex flex-col justify-center min-h-full px-4 md:px-6 py-12 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="mb-10 text-left">
        <h1 className="text-2xl font-semibold text-[var(--text-strong)] tracking-tight flex items-center gap-2">
          Serein{" "}
          <span className="text-[var(--text-tertiary)] font-normal">
            / Workspace
          </span>
        </h1>
        <p className="text-[14px] text-[var(--text-secondary)] mt-2 font-medium">
          技术笔记知识库 · 联网搜索 · Agent 驱动
        </p>
      </div>

      {/* 快捷提问 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {suggestions.map((s, idx) => {
          const Icon = s.icon;
          return (
            <button
              key={idx}
              onClick={() => onSend(s.text)}
              className="group flex flex-col items-start p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-strong)] transition-colors text-left"
            >
              <div className="mb-3 text-[var(--text-tertiary)] group-hover:text-[var(--text-strong)] transition-colors">
                <Icon strokeWidth={1.5} className="w-5 h-5" />
              </div>
              <span className="text-[14px] font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-strong)] transition-colors">
                {s.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 加载中屏幕
 */
function LoadingScreen() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[var(--app-bg)]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
        <span className="text-[14px] text-[var(--text-secondary)]">加载中...</span>
      </div>
    </div>
  );
}

/**
 * 用户菜单
 */
function UserMenu({
  user,
  onLogout,
}: {
  user: { name: string | null; email: string; avatar: string | null } | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.name || user?.email?.split("@")[0] || "用户";
  const initials = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {/* 头像 */}
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border-default)] flex items-center justify-center">
            <span className="text-[12px] font-medium text-[var(--text-secondary)]">
              {initials}
            </span>
          </div>
        )}
      </button>

      {/* 下拉菜单 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-[var(--surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50">
          {/* 用户信息 */}
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <p className="text-[13px] font-medium text-[var(--text-strong)] truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
              {user?.email}
            </p>
          </div>

          {/* 菜单项 */}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-strong)] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * 未登录提示屏幕
 */
function LoginRequiredScreen() {
  return (
    <div className="h-dvh flex flex-col bg-[var(--app-bg)]">
      {/* 顶部导航 */}
      <header className="flex-shrink-0 border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-6 h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-strong)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[13px] font-medium">返回博客</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />
            <span className="text-[13px] font-semibold text-[var(--text-strong)] tracking-wide uppercase">
              Serein Engine
            </span>
          </div>

          <div className="w-[72px]" />
        </div>
      </header>

      {/* 登录提示 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl border border-[var(--border-default)] bg-[var(--surface)] flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-[var(--text-tertiary)]" />
          </div>

          <h1 className="text-xl font-semibold text-[var(--text-strong)] mb-2">
            需要登录
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mb-8">
            AI 对话功能需要登录后才能使用，请先登录或注册账号
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900 text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              登录 / 注册
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] text-[14px] font-medium hover:border-[var(--text-strong)] hover:text-[var(--text-strong)] transition-colors"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
