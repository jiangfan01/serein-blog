/**
 * 聊天状态管理 Hook
 *
 * 职责：消息列表管理 + 发送逻辑 + 打字机效果 + 断线重连
 *
 * 多会话支持：
 * - sessionId: 当前会话 ID（必须）
 * - loadHistory: 加载历史消息
 * - clearMessages: 清空消息（切换会话时用）
 *
 * 断线重连：
 * - executionId: 当前执行 ID（用于断线重连）
 * - recoverExecution: 恢复执行状态
 * - 页面可见性变化时自动检查并恢复
 *
 * 打字机效果：buffer 收集 + RAF 批量刷新
 * - SSE chunk 到达时只往 buffer 追加，不触发渲染
 * - RAF 每帧从 buffer 取字符刷到 state
 * - 这样 React 每帧最多渲染一次，避免高频 setState 卡顿
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useSSEParser } from "./use-sse-parser";
import { useTokenStore } from "./use-auth";
import type { SessionMessage } from "./use-sessions";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolStatus?: string; // 当前正在执行的工具状态（进行中才有）
  toolName?: string;
  toolCalls?: ToolCallRecord[]; // 已完成的工具调用记录（永久保留）
  model?: string; // 使用的模型名称
  intent?: string; // 意图分类
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

const INITIAL_TYPEWRITER_DELAY = 160;
const FRAME_INTERVAL = 28;

function getTypewriterStep(remaining: number) {
  if (remaining > 180) return 8;
  if (remaining > 80) return 5;
  if (remaining > 28) return 3;
  return 1;
}

/**
 * 将数据库消息格式转换为 UI 消息格式
 */
function convertToUIMessage(msg: SessionMessage): ChatMessage | null {
  // 只处理 user 和 assistant 消息
  if (msg.role !== "user" && msg.role !== "assistant") {
    return null;
  }

  const uiMsg: ChatMessage = {
    role: msg.role,
    content: msg.content,
  };

  // 转换 toolCalls
  if (msg.toolCalls && msg.toolCalls.length > 0) {
    uiMsg.toolCalls = msg.toolCalls.map((tc) => ({
      tool: tc.tool,
      args: tc.args,
      result: tc.result,
      status: "done" as const,
    }));
  }

  // 转换 metadata
  if (msg.metadata) {
    uiMsg.model = msg.metadata.model;
    uiMsg.intent = msg.metadata.intent;
  }

  return uiMsg;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { streamChat, cancel } = useSSEParser();

  // 打字机相关 ref
  const bufferRef = useRef("");
  const displayedRef = useRef("");
  const rafIdRef = useRef<number>(0);
  const firstBufferedAtRef = useRef(0);
  const lastFlushAtRef = useRef(0);

  // 断线重连相关
  const executionIdRef = useRef<string | null>(null);
  const isRecoveringRef = useRef(false);
  const getAccessToken = () => useTokenStore.getState().accessToken;

  /**
   * 加载历史消息
   */
  const loadHistory = useCallback((historyMessages: SessionMessage[]) => {
    const uiMessages = historyMessages
      .map(convertToUIMessage)
      .filter((m): m is ChatMessage => m !== null);
    setMessages(uiMessages);
  }, []);

  /**
   * 清空消息（切换会话时用）
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    // 重置打字机状态
    bufferRef.current = "";
    displayedRef.current = "";
    cancelAnimationFrame(rafIdRef.current);
    // 重置断线重连状态
    executionIdRef.current = null;
    isRecoveringRef.current = false;
  }, []);

  /**
   * 启动打字机 RAF 循环
   * 每帧按 buffer 剩余量动态消费，避免模型分批到达时前端过快吃空。
   */
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
        (now - firstBufferedAt >= INITIAL_TYPEWRITER_DELAY ||
          buf.length > 80);
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
   * @param question 用户问题
   * @param sessionId 会话 ID（必须）
   */
  const sendMessage = useCallback(
    async (question: string, sessionId: string) => {
      if (!question.trim() || loading || !sessionId) return;

      // 添加用户消息 + 空的 assistant 消息（占位）
      setMessages((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: "" },
      ]);

      setLoading(true);
      startTypewriter();

      await streamChat(question, sessionId, {
        onThinking: () => {
          // thinking 状态由 loading + 空 content 自动显示
        },

        onModelSelect: (model, intent) => {
          // 记录使用的模型和意图
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, model, intent };
            }
            return updated;
          });
        },

        onExecutionStart: (executionId) => {
          // 保存 executionId 用于断线重连
          executionIdRef.current = executionId;
        },

        onTextDelta: (content) => {
          // 只往 buffer 追加，不直接 setState
          // RAF 循环会自动把 buffer 内容刷到 UI
          if (!firstBufferedAtRef.current) {
            firstBufferedAtRef.current = performance.now();
          }
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
            // 清除 executionId，执行已完成
            executionIdRef.current = null;
          }, 100);
        },
      });
    },
    [loading, streamChat, startTypewriter, stopTypewriter]
  );

  /**
   * 断线重连：恢复执行状态
   * 轮询 /api/chat/execution/{id} 获取进度
   */
  const recoverExecution = useCallback(async () => {
    const executionId = executionIdRef.current;
    if (!executionId || isRecoveringRef.current) return;

    isRecoveringRef.current = true;
    const accessToken = getAccessToken();

    try {
      const res = await fetch(`/api/chat/execution/${executionId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (!res.ok) {
        // 执行记录不存在或无权访问，清除状态
        executionIdRef.current = null;
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (data.status === "running") {
        // 还在执行中，恢复显示已有内容
        const progress = data.progress;
        if (progress?.partialContent) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: progress.partialContent,
                model: progress.metadata?.model,
                intent: progress.metadata?.intent,
                toolCalls: progress.toolCalls?.map((tc: { tool: string; args: Record<string, unknown>; result: string }) => ({
                  ...tc,
                  status: tc.result ? "done" : "running",
                })),
              };
            }
            return updated;
          });
        }

        // 继续轮询
        setTimeout(() => {
          isRecoveringRef.current = false;
          recoverExecution();
        }, 500);
      } else if (data.status === "completed") {
        // 执行完成，显示最终结果
        const result = data.result;
        if (result?.content) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: result.content,
                model: result.metadata?.model,
                intent: result.metadata?.intent,
                toolCalls: result.toolCalls?.map((tc: { tool: string; args: Record<string, unknown>; result: string }) => ({
                  ...tc,
                  status: "done",
                })),
              };
            }
            return updated;
          });
        }
        executionIdRef.current = null;
        setLoading(false);
      } else {
        // failed 或其他状态
        executionIdRef.current = null;
        setLoading(false);
      }
    } catch (err) {
      console.error("[useChat] 恢复执行失败:", err);
    } finally {
      isRecoveringRef.current = false;
    }
  }, []);

  /**
   * 监听页面可见性变化，断线后自动恢复
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && executionIdRef.current && loading) {
        // 页面重新可见，且有正在执行的任务，尝试恢复
        recoverExecution();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loading, recoverExecution]);

  return {
    messages,
    loading,
    sendMessage,
    loadHistory,
    clearMessages,
    cancel,
    recoverExecution,
  };
}
