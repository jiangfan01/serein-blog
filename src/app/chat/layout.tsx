/**
 * Chat 布局
 *
 * 共享侧边栏和 header，children 是具体页面内容
 * - /chat → 欢迎页
 * - /chat/[sessionId] → 会话页
 */
"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, LogOut } from "lucide-react";
import Link from "next/link";
import { MobileSidebarDrawer, MobileMenuButton, DesktopExpandButton } from "@/components/chat/mobile-sidebar-drawer";
import { useAuth } from "@/hooks/use-auth";
import { ToastContainer } from "@/components/ui/toast";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();

  /**
   * 会话切换 = 路由跳转
   */
  const handleSessionChange = (sessionId: string) => {
    if (sessionId) {
      router.push(`/chat/${sessionId}`);
    } else {
      router.push("/chat");
    }
  };

  // 认证加载中
  if (authLoading) {
    return <LoadingScreen />;
  }

  // 未登录
  if (!isAuthenticated) {
    return <LoginRequiredScreen />;
  }

  return (
    <div className="h-dvh flex bg-[var(--app-bg)] font-sans">
      {/* 侧边栏 */}
      <MobileSidebarDrawer onSessionChange={handleSessionChange} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部导航 */}
        <header className="flex-shrink-0 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            {/* 左侧：移动端菜单 + 桌面端展开 + 返回按钮 */}
            <div className="flex items-center gap-2">
              <MobileMenuButton />
              <DesktopExpandButton />
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

        {/* 页面内容 */}
        {children}
      </div>

      <ToastContainer />
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

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 py-1 bg-[var(--surface)] border border-[var(--border-default)] rounded-lg shadow-lg z-50">
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <p className="text-[13px] font-medium text-[var(--text-strong)] truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] truncate">
              {user?.email}
            </p>
          </div>
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
