/**
 * 简化版聊天 Hook（不支持多会话）
 *
 * 用于小窗聊天组件 (ai-chat.tsx)
 * 不需要 sessionId，消息不持久化到数据库
 *
 * 注意：这是一个临时方案，后续可以考虑让小窗也支持多会话
 */
import { useState, useRef, useCallback } from "react";
import { useSSEParser } from "./use-sse-parser";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolStatus?: string;
  toolName?: string;
  toolCalls?: ToolCallRecord[];
  model?: string;
  intent?: string;
}

export interface ToolCallRecord {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  status: "running" | "done" | "error";
}

const TOOL_LABELS: Record<string, string> = {
  rag_search: "搜索博客笔记",
  web_search: "联网搜索",
};

const INITIAL_TYPEWRITER_DELAY = 160;
const FRAME_INTERVAL = 28;

function getTypewriterStep(remaining: number) {
  if (remaining > 180) return 8;
  if (remaining > 80) return 5;
  if (remaining > 28) return 3;
  return 1;
}

/**
 * 简化版聊天 Hook
 * 不需要 sessionId，适用于小窗聊天
 */
export function useSimpleChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { streamChat, cancel } = useSSEParser();

  // 打字机相关 ref
  const bufferRef = useRef("");
  const displayedRef = useRef("");
  const rafIdRef = useRef<number>(0);
  const firstBufferedAtRef = useRef(0);
  const lastFlushAtRef = useRef(0);

  // 临时 sessionId（每次组件挂载生成一个）
  const tempSessionIdRef = useRef<string | null>(null);

  const startTypewriter = useCallback(() => {
    displayedRef.current = "";
    bufferRef.current = "";
    firstBufferedAtRef.current = 0;
    lastFlushAtRef.current = 0;

    const tick = (now: number) => {
      const buf = bufferRef.current;
      const displayed = displayedRef.current;
      const firstBufferedAt = firstBufferedAtRef.current;
      const hasEnoughWarmup =
        firstBufferedAt > 0 &&
        (now - firstBufferedAt >= INITIAL_TYPEWRITER_DELAY || buf.length > 80);
      const canFlush = now - lastFlushAtRef.current >= FRAME_INTERVAL;

      if (hasEnoughWarmup && canFlush && buf.length > displayed.length) {
        const remaining = buf.length - displayed.length;
        const charsPerFrame = Math.min(getTypewriterStep(remaining), remaining);
        const next = buf.slice(0, displayed.length + charsPerFrame);
        displayedRef.current = next;
        lastFlushAtRef.current = now;

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, content: next };
          }
          return updated;
        });
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTypewriter = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    const final = bufferRef.current;

    if (final && final !== displayedRef.current) {
      displayedRef.current = final;
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: final };
        }
        return updated;
      });
    }
  }, []);

  /**
   * 获取或创建临时会话
   */
  const getOrCreateTempSession = useCallback(async (): Promise<string | null> => {
    if (tempSessionIdRef.current) {
      return tempSessionIdRef.current;
    }

    try {
      // 动态导入 token store
      const { useTokenStore } = await import("./use-auth");
      const accessToken = useTokenStore.getState().accessToken;

      if (!accessToken) {
        return null;
      }

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        return null;
      }

      const session = await res.json();
      tempSessionIdRef.current = session.id;
      return session.id;
    } catch {
      return null;
    }
  }, []);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      // 获取或创建临时会话
      const sessionId = await getOrCreateTempSession();
      if (!sessionId) {
        // 没有登录或创建会话失败，显示错误
        setMessages((prev) => [
          ...prev,
          { role: "user", content: question },
          { role: "assistant", content: "请先登录后再使用聊天功能" },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "" },
      ]);

      setLoading(true);
      startTypewriter();

      await streamChat(question, sessionId, {
        onThinking: () => {},

        onModelSelect: (model, intent) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, model, intent };
            }
            return updated;
          });
        },

        onExecutionStart: () => {
          // simple-chat 不需要断线重连
        },

        onTextDelta: (content) => {
          if (!firstBufferedAtRef.current) {
            firstBufferedAtRef.current = performance.now();
          }
          bufferRef.current += content;
        },

        onToolStart: (tool, args) => {
          const label = TOOL_LABELS[tool] || tool;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              const calls = last.toolCalls || [];
              updated[updated.length - 1] = {
                ...last,
                toolStatus: `正在${label}...`,
                toolName: tool,
                toolCalls: [...calls, { tool, args, result: "", status: "running" }],
              };
            }
            return updated;
          });
        },

        onToolEnd: (tool, result) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant" && last.toolCalls) {
              const calls = [...last.toolCalls];
              const idx = calls.findLastIndex(
                (c) => c.tool === tool && c.status === "running"
              );
              if (idx >= 0) {
                calls[idx] = { ...calls[idx], result, status: "done" };
              }
              updated[updated.length - 1] = {
                ...last,
                toolStatus: undefined,
                toolName: undefined,
                toolCalls: calls,
              };
            }
            return updated;
          });
        },

        onError: (message) => {
          if (!bufferRef.current) {
            bufferRef.current = message;
          }
        },

        onDone: () => {
          setTimeout(() => {
            stopTypewriter();
            setLoading(false);
          }, 100);
        },
      });
    },
    [loading, streamChat, startTypewriter, stopTypewriter, getOrCreateTempSession]
  );

  return {
    messages,
    loading,
    sendMessage,
    cancel,
  };
}
