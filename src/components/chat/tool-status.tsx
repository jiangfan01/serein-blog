/**
 * 工具调用状态组件
 *
 * 对应你上家架构的：UI 组件层 → ToolRenderer
 * 显示 Agent 正在调用什么工具（"正在搜索博客笔记..."）
 *
 * 以后可以扩展：显示工具参数、返回结果摘要、耗时等
 */
import { Loader2 } from "lucide-react";

interface ToolStatusProps {
  status: string; // "正在搜索博客笔记..." 等
}

export function ToolStatus({ status }: ToolStatusProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
      <span className="text-xs text-[var(--text-tertiary)]">{status}</span>
    </div>
  );
}
