/**
 * SSE 流解析 Hook
 *
 * 职责：解析 SSE 协议格式，按事件类型分发回调
 *
 * 对应你上家架构的：SSE 解析层 + 流处理层
 * 区别：你上家是独立的 service 类，这里用 hook 封装（博客单会话够用）
 *
 * SSE 协议格式：
 *   data: {"type":"thinking"}\n\n
 *   data: {"type":"tool_start","tool":"rag_search","args":{"query":"React"}}\n\n
 *   data: {"type":"text_delta","content":"React 是..."}\n\n
 *   data: {"type":"done"}\n\n
 */
import { useCallback, useRef } from "react";
import type { SSEEvent } from "@/lib/agent/types";

interface SSEHandlers {
  onThinking: () => void;
  onTextDelta: (content: string) => void;
  onToolStart: (tool: string, args: Record<string, unknown>) => void;
  onToolEnd: (tool: string, result: string) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

/**
 * 解析单行 SSE data，返回 SSEEvent 或 null
 */
function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith("data: ")) return null;
  const data = line.slice(6);
  try {
    return JSON.parse(data) as SSEEvent;
  } catch {
    return null;
  }
}

export function useSSEParser() {
  // 用 ref 存 AbortController，支持取消请求
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 发送请求并解析 SSE 流
   *
   * 核心流程：
   * 1. fetch POST 请求
   * 2. 拿到 ReadableStream
   * 3. 逐 chunk 读取，按 \n 分行
   * 4. 每行解析成 SSEEvent，按 type 分发到对应 handler
   */
  const streamChat = useCallback(
    async (question: string, handlers: SSEHandlers) => {
      // 取消上一次未完成的请求
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        });

        if (!res.ok) {
          handlers.onError("请求失败");
          handlers.onDone();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          handlers.onError("无法读取响应");
          handlers.onDone();
          return;
        }

        const decoder = new TextDecoder();

        // 读取流
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n").filter((l) => l.startsWith("data: "));

          for (const line of lines) {
            const event = parseSSELine(line);
            if (!event) continue;

            // 按 type 分发到对应 handler
            switch (event.type) {
              case "thinking":
                handlers.onThinking();
                break;
              case "text_delta":
                handlers.onTextDelta(event.content);
                break;
              case "tool_start":
                handlers.onToolStart(event.tool, event.args);
                break;
              case "tool_end":
                handlers.onToolEnd(event.tool, event.result);
                break;
              case "error":
                handlers.onError(event.message);
                break;
              case "done":
                handlers.onDone();
                break;
            }
          }
        }

        // 流读完了但没收到 done 事件，兜底触发
        handlers.onDone();
      } catch (err) {
        // AbortError 是主动取消，不算错误
        if (err instanceof DOMException && err.name === "AbortError") return;
        handlers.onError("请求出错了，请稍后再试。");
        handlers.onDone();
      }
    },
    []
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { streamChat, cancel };
}
