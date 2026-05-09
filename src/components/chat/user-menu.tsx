/**
 * 用户菜单组件
 * 
 * 显示用户头像，点击弹出菜单
 * 包含回答风格设置等功能
 */
"use client";

import { useState, useRef, useEffect } from "react";
import { User, Check, ChevronRight, LogOut, Settings } from "lucide-react";
import { useUserPreferences, useUpdatePreferences } from "@/hooks/use-user-preferences";
import { useAuth } from "@/hooks/use-auth";
import { getStyleOptions, type ResponseStyleKey } from "@/lib/response-styles";
import { toast } from "@/components/ui/toast";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { data: preferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const { logout } = useAuth();

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowStyleMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleStyleChange = async (styleKey: ResponseStyleKey) => {
    try {
      await updatePreferences.mutateAsync({ responseStyle: styleKey });
      toast.success("已更新回答风格");
      setShowStyleMenu(false);
      setIsOpen(false);
    } catch {
      toast.error("更新失败");
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    window.location.href = "/";
  };

  const styleOptions = getStyleOptions();
  const currentStyle = styleOptions.find((s) => s.key === preferences?.responseStyle) || styleOptions[0];

  return (
    <div ref={menuRef} className="relative">
      {/* 头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border-default)] flex items-center justify-center hover:border-[var(--border-strong)] transition-colors"
      >
        {preferences?.avatar ? (
          <img
            src={preferences.avatar}
            alt="avatar"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-4 h-4 text-[var(--text-tertiary)]" />
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* 用户信息 */}
          <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
            <div className="text-[13px] font-medium text-[var(--text-strong)] truncate">
              {preferences?.name || preferences?.email?.split("@")[0] || "用户"}
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
              {preferences?.email}
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1.5">
            {/* 回答风格 */}
            <div className="relative">
              <button
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className="w-full flex items-center justify-between px-3 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span>回答风格</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
                  <span className="text-[11px]">{currentStyle.label}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showStyleMenu ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* 风格子菜单 */}
              {showStyleMenu && (
                <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
                  {styleOptions.map((style) => (
                    <button
                      key={style.key}
                      onClick={() => handleStyleChange(style.key)}
                      disabled={updatePreferences.isPending}
                      className="w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[var(--text-secondary)]">{style.label}</span>
                        <span className="text-[10px] text-[var(--text-quaternary)]">{style.description}</span>
                      </div>
                      {preferences?.responseStyle === style.key && (
                        <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 分隔线 */}
            <div className="my-1.5 border-t border-[var(--border-subtle)]" />

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
