/**
 * 侧边栏容器组件
 *
 * - 桌面端 (>=768px) 固定侧边栏
 * - 移动端 (<768px) 抽屉模式
 */
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { SessionSidebar } from "./session-sidebar";

interface MobileSidebarDrawerProps {
  onSessionChange?: (sessionId: string) => void;
}

export function MobileSidebarDrawer({ onSessionChange }: MobileSidebarDrawerProps) {
  const { sidebarOpen, setSidebarOpen } = useSessionStore();

  // 打开时禁止 body 滚动
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* 桌面端：固定侧边栏 */}
      <aside className="hidden md:block w-64 flex-shrink-0 h-full border-r border-[var(--border-subtle)]">
        <SessionSidebar onSessionChange={onSessionChange} />
      </aside>

      {/* 移动端：抽屉模式 */}
      <div className="md:hidden">
        {/* 遮罩层 */}
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* 抽屉 */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--app-bg)] shadow-xl transition-transform duration-200 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 z-10 p-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
          <SessionSidebar onSessionChange={onSessionChange} />
        </aside>
      </div>
    </>
  );
}

/**
 * 移动端菜单按钮
 */
export function MobileMenuButton() {
  const { toggleSidebar } = useSessionStore();

  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
      aria-label="打开会话列表"
    >
      <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
