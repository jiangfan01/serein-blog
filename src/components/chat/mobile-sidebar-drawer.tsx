/**
 * 移动端侧边栏抽屉组件
 *
 * 设计方向：流畅的滑动动画 + 毛玻璃遮罩
 * - 移动端 (<768px) 显示为抽屉模式
 * - 桌面端 (>=768px) 直接显示侧边栏
 * - 半透明毛玻璃遮罩层
 * - 弹性滑动动画
 */
"use client";

import { useEffect } from "react";
import { X, PanelLeftClose } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { SessionSidebar } from "./session-sidebar";

interface MobileSidebarDrawerProps {
  /** 会话切换回调 */
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
      <aside className="hidden md:flex w-72 flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--app-bg)]">
        <div className="w-full">
          <SessionSidebar onSessionChange={onSessionChange} />
        </div>
      </aside>

      {/* 移动端：抽屉模式 */}
      <div className="md:hidden">
        {/* 遮罩层 - 毛玻璃效果 */}
        <div
          className={`
            fixed inset-0 z-40 transition-all duration-300 ease-[var(--ease-soft)]
            ${sidebarOpen
              ? "opacity-100 backdrop-blur-sm bg-black/40"
              : "opacity-0 pointer-events-none backdrop-blur-none bg-black/0"
            }
          `}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* 抽屉 */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[320px]
            bg-[var(--app-bg)] border-r border-[var(--border-default)]
            shadow-[var(--shadow-lg)]
            transition-transform duration-300 ease-[var(--ease-soft)]
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-strong)] hover:border-[var(--border-default)] transition-all duration-[var(--duration-fast)] shadow-sm"
            aria-label="关闭侧边栏"
          >
            <X className="w-4 h-4" />
          </button>

          <SessionSidebar onSessionChange={onSessionChange} />
        </aside>
      </div>
    </>
  );
}

/**
 * 移动端菜单按钮
 * 仅在移动端 (<768px) 显示
 */
export function MobileMenuButton() {
  const { toggleSidebar } = useSessionStore();

  return (
    <button
      onClick={toggleSidebar}
      className="md:hidden group relative p-2 -ml-2 rounded-lg hover:bg-[var(--surface)] transition-all duration-[var(--duration-fast)]"
      aria-label="打开会话列表"
    >
      {/* 汉堡菜单图标 - 自定义动画 */}
      <div className="relative w-5 h-5 flex flex-col items-center justify-center gap-1">
        <span className="block w-4 h-0.5 bg-[var(--text-secondary)] rounded-full transition-all duration-200 group-hover:w-5 group-hover:bg-[var(--text-strong)]" />
        <span className="block w-3 h-0.5 bg-[var(--text-secondary)] rounded-full transition-all duration-200 group-hover:w-5 group-hover:bg-[var(--text-strong)]" />
        <span className="block w-4 h-0.5 bg-[var(--text-secondary)] rounded-full transition-all duration-200 group-hover:w-5 group-hover:bg-[var(--text-strong)]" />
      </div>
    </button>
  );
}
