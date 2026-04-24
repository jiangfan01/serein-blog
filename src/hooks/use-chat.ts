/**
 * 聊天状态管理 Hook
 *
 * 职责：消息列表管理 + 发送逻辑 + 打字机效果
 *
 * 对应你上家架构的：状态管理层（multiSessionStore）
 * 区别：你上家用 zustand store 管理多会话，这里用 hook 管理单会话
 * 以后要加多会话，把这里的状态迁移到 zustand 就行
 *
 * 打字机效果：buffer 收集 + RAF 批量刷新
 * - SSE chunk 到达时只往 buffer 追加，不触发渲染
 * - RAF 每帧从 buffer 取字符刷到 state
 * - 这样 React 每帧最多渲染一次，避免高频 setState 卡顿
 */
import { useState, useRef, useCallback } from "react";
import { useSSEParser } from "./use-sse-parser";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolStatus?: string; // 当前正在执行的工具状态（进行中才有）
  toolName?: string;
  toolCalls?: ToolCallRecord[]; // 已完成的工具调用记录（永久保留）
}

// 工具调用记录
export interface ToolCallRecord {
  tool: string; // "rag_search" | "web_search"
  args: Record<string, unknown>;
  result: string;
  status: "running" | "done" | "error";
}

// 工具名到中文标签的映射
const TOOL_LABELS: Record<string, string> = {
  rag_search: "搜索博客笔记",
  web_search: "联网搜索",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { streamChat, cancel } = useSSEParser();

  // 打字机相关 ref
  const bufferRef = useRef("");
  const displayedRef = useRef("");
  const rafIdRef = useRef<number>(0);

  /**
   * 启动打字机 RAF 循环
   * 每帧从 buffer 取 1~3 个字符刷到最后一条 assistant 消息
   */
  const startTypewriter = useCallback(() => {
    displayedRef.current = "";
    bufferRef.current = "";

    const tick = () => {
      const buf = bufferRef.current;
      const displayed = displayedRef.current;

      if (buf.length > displayed.length) {
        const charsPerFrame = Math.min(3, buf.length - displayed.length);
        const next = buf.slice(0, displayed.length + charsPerFrame);
        displayedRef.current = next;

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

  /**
   * 停止打字机，把 buffer 里剩余内容一次性刷完
   */
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
   * 发送消息
   */
  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      // 添加用户消息 + 空的 assistant 消息（占位）
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "" },
      ]);

      setLoading(true);
      startTypewriter();

      await streamChat(question, {
        onThinking: () => {
          // thinking 状态由 loading + 空 content 自动显示
        },

        onTextDelta: (content) => {
          // 只往 buffer 追加，不直接 setState
          // RAF 循环会自动把 buffer 内容刷到 UI
          bufferRef.current += content;
        },

        onToolStart: (tool, args) => {
          const label = TOOL_LABELS[tool] || tool;
          // 添加一条 running 状态的工具记录
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
          // 把最后一条 running 的工具记录标记为 done
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant" && last.toolCalls) {
              const calls = [...last.toolCalls];
              const idx = calls.findLastIndex((c) => c.tool === tool && c.status === "running");
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
    [loading, streamChat, startTypewriter, stopTypewriter]
  );

  return {
    messages,
    loading,
    sendMessage,
    cancel,
  };
}
