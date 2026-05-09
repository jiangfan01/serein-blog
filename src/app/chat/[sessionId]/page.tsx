/**
 * 会话页面
 *
 * /chat/[sessionId] 路由
 * 加载历史消息，正常聊天
 * 支持通过 ?q=xxx 传入初始消息（从欢迎页跳转过来时）
 */
"use client";

import { useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, Pause } from "lucide-react";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { useChat } from "@/hooks/use-chat";
import { useSessionMessages, useOptimisticUpdateTitle, useInfiniteSessions } from "@/hooks/use-sessions";

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const initialQuestion = searchParams.get("q");

  const { messages, loading, paused, sendMessage, loadHistory, checkAndRecover, pauseExecution } = useChat();
  const { data: historyMessages, isLoading: messagesLoading } = useSessionMessages(sessionId);
  const { data: sessionsData } = useInfiniteSessions();
  const optimisticUpdateTitle = useOptimisticUpdateTitle();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 是否已处理初始消息
  const initialSentRef = useRef(false);
  // 是否已检查断线重连
  const recoveryCheckedRef = useRef(false);

  /**
   * 加载历史消息
   */
  useEffect(() => {
    if (historyMessages) {
      loadHistory(historyMessages);
    }
  }, [historyMessages, loadHistory]);

  /**
   * 检查断线重连
   * 历史加载完成后，检查当前会话是否有 running 或 interrupted 状态的执行
   */
  useEffect(() => {
    if (recoveryCheckedRef.current || messagesLoading || !sessionId) return;
    if (initialQuestion) return; // 有初始消息时不检查，让它正常发送

    recoveryCheckedRef.current = true;

    // 从 sessions 列表中找到当前会话的 replyStatus
    const currentSession = sessionsData?.pages
      .flatMap((page) => page.sessions)
      .find((s) => s.id === sessionId);

    // running 或 interrupted 状态都需要恢复
    if (currentSession?.replyStatus === "running" || currentSession?.replyStatus === "interrupted") {
      console.log("[SessionPage] 检测到需要恢复的状态:", currentSession.replyStatus);
      checkAndRecover(sessionId, currentSession.replyStatus);
    }
  }, [sessionId, messagesLoading, initialQuestion, sessionsData, checkAndRecover]);

  /**
   * 处理从欢迎页带过来的初始消息
   * 历史加载完成后，如果有 ?q= 参数且还没发送过，自动发送
   */
  useEffect(() => {
    if (initialSentRef.current || !initialQuestion || !sessionId) return;
    if (messagesLoading) return; // 等历史加载完

    initialSentRef.current = true;

    // 清除 URL 中的 q 参数（不触发重新渲染）
    window.history.replaceState(null, "", `/chat/${sessionId}`);

    sendMessage(initialQuestion, sessionId);
  }, [initialQuestion, sessionId, messagesLoading, sendMessage]);

  /**
   * 发送消息
   */
  const handleSend = useCallback(
    (question: string) => {
      sendMessage(question, sessionId);
    },
    [sendMessage, sessionId]
  );

  // 滚动到底部
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* 对话区域 */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto" data-lenis-prevent>
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[13px]">加载中...</span>
            </div>
          </div>
        ) : messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full animate-in fade-in duration-200">
            <p className="text-[13px] text-[var(--text-tertiary)]">发送消息开始对话</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-8 animate-in fade-in duration-200">
            <ChatMessages
              messages={messages}
              loading={loading}
              isFullscreen
              hideEmptyState
            />
            {/* 暂停/中断状态提示 */}
            {paused && (
              <div className="flex items-center justify-center gap-2 mt-4 py-3 px-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <Pause className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[13px] text-amber-700 dark:text-amber-300">
                  对话已中断，发送新消息继续
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-4">
          <ChatInput 
            onSend={handleSend} 
            onPause={pauseExecution}
            disabled={loading} 
            autoFocus 
          />
          <div className="flex items-center justify-center gap-2 mt-3 text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide uppercase">
            <span>知识库检索</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>联网搜索</span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-strong)]" />
            <span>Kimi/DeepSeek 驱动</span>
          </div>
        </div>
      </div>
    </>
  );
}
