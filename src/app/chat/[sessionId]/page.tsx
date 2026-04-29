/**
 * 会话页面
 *
 * /chat/[sessionId] 路由
 * 展示具体会话的消息列表，支持发送新消息
 */
"use client";

import { useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { useChat } from "@/hooks/use-chat";
import { useSessionMessages, useSession, useOptimisticUpdateTitle } from "@/hooks/use-sessions";
import { useSessionStore } from "@/stores/session-store";
import { toast } from "@/components/ui/toast";

export default function SessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const initialQuestion = searchParams.get("q");

  const { setActiveSession } = useSessionStore();
  const optimisticUpdateTitle = useOptimisticUpdateTitle();

  // 获取会话信息
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useSession(sessionId);
  
  // 获取历史消息
  const { data: historyMessages, isLoading: messagesLoading } = useSessionMessages(sessionId);

  // 聊天状态
  const { messages, loading, sendMessage, loadHistory } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 初始消息是否已发送
  const initialSentRef = useRef(false);

  /**
   * 设置当前活跃会话
   */
  useEffect(() => {
    setActiveSession(sessionId);
  }, [sessionId, setActiveSession]);

  /**
   * 加载历史消息
   */
  useEffect(() => {
    if (historyMessages && !loading) {
      loadHistory(historyMessages);
    }
  }, [historyMessages, loading, loadHistory]);

  /**
   * 处理初始消息（从 URL 参数）
   * 只在首次加载且有初始消息时发送
   */
  useEffect(() => {
    if (initialQuestion && !initialSentRef.current && !messagesLoading) {
      initialSentRef.current = true;
      // 清除 URL 参数
      window.history.replaceState(null, "", `/chat/${sessionId}`);
      // 发送消息
      sendMessage(decodeURIComponent(initialQuestion), sessionId);
    }
  }, [initialQuestion, sessionId, messagesLoading, sendMessage]);

  /**
   * 发送消息
   */
  const handleSendMessage = useCallback(
    (question: string) => {
      // 如果会话没有标题，乐观更新
      if (session && !session.title) {
        const title = question.trim().slice(0, 50) + (question.trim().length > 50 ? "..." : "");
        optimisticUpdateTitle(sessionId, title);
      }
      sendMessage(question, sessionId);
    },
    [session, sessionId, optimisticUpdateTitle, sendMessage]
  );

  /**
   * 滚动到底部
   */
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 会话不存在
  if (sessionError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-[14px] text-[var(--text-secondary)] mb-4">会话不存在或已被删除</p>
        <button
          onClick={() => router.push("/chat")}
          className="text-[14px] text-[var(--accent)] hover:underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  // 加载中（只在首次加载时显示，有初始消息时不显示）
  if ((sessionLoading || messagesLoading) && !initialQuestion) {
    return (
      <>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[13px]">加载中...</span>
          </div>
        </div>
        <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
          <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-4">
            <div className="h-12 bg-[var(--surface-secondary)] rounded-xl animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* 消息区域 */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto" data-lenis-prevent>
        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-[var(--text-tertiary)]">发送消息开始对话</p>
          </div>
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
          <ChatInput onSend={handleSendMessage} disabled={loading} autoFocus />
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
