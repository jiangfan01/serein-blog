/**
 * 聊天首页 - 欢迎页
 *
 * /chat 路由
 * 展示欢迎信息和快捷提问，发送消息后跳转到具体会话页
 */
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Cpu, Network, Library, Loader2 } from "lucide-react";
import { useCreateSession, useOptimisticUpdateTitle } from "@/hooks/use-sessions";
import { ChatInput } from "@/components/chat/chat-input";
import { toast } from "@/components/ui/toast";

export default function ChatHomePage() {
  const router = useRouter();
  const createSession = useCreateSession();
  const optimisticUpdateTitle = useOptimisticUpdateTitle();

  /**
   * 发送消息：创建会话 → 跳转到会话页
   * 消息内容通过 URL 参数传递，会话页负责发送
   */
  const handleSend = useCallback(
    async (question: string) => {
      try {
        // 创建会话
        const newSession = await createSession.mutateAsync();
        
        // 乐观更新标题
        const title = question.trim().slice(0, 50) + (question.trim().length > 50 ? "..." : "");
        optimisticUpdateTitle(newSession.id, title);
        
        // 跳转到会话页，带上初始消息
        const encodedQuestion = encodeURIComponent(question);
        router.push(`/chat/${newSession.id}?q=${encodedQuestion}`);
      } catch (error) {
        console.error("创建会话失败:", error);
        toast.error("创建会话失败");
      }
    },
    [createSession, optimisticUpdateTitle, router]
  );

  const suggestions = [
    { text: "解析 React Fiber 渲染架构", icon: Cpu },
    { text: "对比 Vue 与 React 更新机制", icon: Library },
    { text: "探索 RAG 检索增强生成架构", icon: Network },
    { text: "构建本地 Agent 工作流", icon: Terminal },
  ];

  return (
    <>
      {/* 欢迎内容 */}
      <div className="flex-1 overflow-y-auto" data-lenis-prevent>
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
                  onClick={() => handleSend(s.text)}
                  disabled={createSession.isPending}
                  className="group flex flex-col items-start p-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface)] hover:border-[var(--text-strong)] transition-colors text-left disabled:opacity-50"
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
      </div>

      {/* 底部输入区 */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-4">
          <ChatInput onSend={handleSend} disabled={createSession.isPending} autoFocus />
          <div className="flex items-center justify-center gap-2 mt-3 text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase">
            <span>知识库检索</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>联网搜索</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>Kimi/DeepSeek 驱动</span>
          </div>
        </div>
      </div>

      {/* 创建中遮罩 */}
      {createSession.isPending && (
        <div className="fixed inset-0 bg-[var(--app-bg)]/80 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-[14px]">创建会话中...</span>
          </div>
        </div>
      )}
    </>
  );
}
