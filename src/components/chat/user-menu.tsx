/**
 * 用户菜单组件
 *
 * 使用 shadcn DropdownMenu + Dialog
 * - 下拉菜单：账号信息、偏好设置、退出登录
 * - 弹窗：风格选择（2列网格布局）
 */
"use client";

import { useState } from "react";
import {
  User,
  LogOut,
  Settings,
  Check,
  Sparkles,
  Zap,
  BookOpen,
  Heart,
  Briefcase,
  Code2,
  Baby,
  Scale,
  Target,
  Terminal,
} from "lucide-react";
import { useUserPreferences, useUpdatePreferences } from "@/hooks/use-user-preferences";
import { useAuth } from "@/hooks/use-auth";
import { getStyleOptions, type ResponseStyleKey } from "@/lib/response-styles";
import { toast } from "@/components/ui/toast";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// 为不同的风格映射对应的图标
const styleIcons: Record<string, React.ElementType> = {
  default: Sparkles,
  concise: Zap,
  detailed: BookOpen,
  friendly: Heart,
  professional: Briefcase,
  technical: Code2,
  beginner: Baby,
  critical: Scale,
  actionable: Target,
  coding: Terminal,
};

export function UserMenu() {
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);

  const { data: preferences } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const { logout } = useAuth();

  const handleStyleChange = async (styleKey: ResponseStyleKey) => {
    try {
      await updatePreferences.mutateAsync({ responseStyle: styleKey });
      toast.success("已更新回答风格");
      setIsStyleDialogOpen(false);
    } catch {
      toast.error("更新失败");
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const styleOptions = getStyleOptions();
  const currentStyleKey = preferences?.responseStyle || "default";
  const displayName = preferences?.name || preferences?.email?.split("@")[0] || "用户";

  return (
    <>
      {/* 下拉菜单 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full outline-none ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8 border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-colors">
              <AvatarImage src={preferences?.avatar || undefined} alt={displayName} />
              <AvatarFallback className="bg-[var(--surface)] text-[var(--text-tertiary)]">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56" sideOffset={8}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none truncate">{displayName}</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate">
                {preferences?.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={() => setIsStyleDialogOpen(true)}
          >
            <Settings className="h-4 w-4 text-[var(--text-tertiary)]" />
            <div className="flex-1">回答风格</div>
            <span className="text-xs text-[var(--text-tertiary)]">
              {styleOptions.find((s) => s.key === currentStyleKey)?.label}
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer text-red-500"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 风格选择弹窗 */}
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>选择回答风格</DialogTitle>
            <DialogDescription>
              选择 AI 助手的默认回复语气和详细程度，这会应用到你的所有新对话中。
            </DialogDescription>
          </DialogHeader>

          {/* 2 列网格布局 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 py-2 max-h-[60vh] overflow-y-auto px-1 pr-2">
            {styleOptions.map((style) => {
              const isSelected = currentStyleKey === style.key;
              const Icon = styleIcons[style.key] || Sparkles;

              return (
                <button
                  key={style.key}
                  onClick={() => handleStyleChange(style.key)}
                  disabled={updatePreferences.isPending}
                  className={`
                    relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200
                    hover:bg-[var(--surface-secondary)] hover:border-[var(--border-strong)]
                    ${
                      isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-sm ring-1 ring-[var(--accent)]/20"
                        : "border-[var(--border-default)] bg-[var(--surface)]"
                    }
                    ${updatePreferences.isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {/* 左侧图标 */}
                  <div
                    className={`
                    p-2 rounded-lg shrink-0
                    ${
                      isSelected
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--surface-secondary)] text-[var(--text-tertiary)]"
                    }
                  `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* 右侧文本 */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-[var(--accent)]" : "text-[var(--text-strong)]"
                        }`}
                      >
                        {style.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[var(--accent)]" />}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">
                      {style.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
