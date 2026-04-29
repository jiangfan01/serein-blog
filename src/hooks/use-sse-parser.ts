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
import { useTokenStore } from "@/hooks/use-auth";

interface SSEHandlers {
  onThinking: () => void;
  onTextDelta: (content: string) => void;
  onToolStart: (tool: string, args: Record<string, unknown>) => void;
  onToolEnd: (tool: string, result: string) => void;
  onModelSelect: (model: string, intent: string) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

/**
 * 解析一个完整 SSE event block，返回 SSEEvent 或 null
 */
function parseSSEBlock(block: string): SSEEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.slice(6))
    .join("\n");

  if (!data) return null;

  try {
    return JSON.parse(data) as SSEEvent;
  } catch {
    return null;
  }
}

export function useSSEParser() {
  // 用 ref 存 AbortController，支持取消请求
  const abortRef = useRef<AbortController | null>(null);
  
  // 获取 accessToken
  const getAccessToken = () => useTokenStore.getState().accessToken;

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
        const accessToken = getAccessToken();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        // 添加认证 header
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
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

        let pendingText = "";

        const dispatchEvent = (event: SSEEvent) => {
          // 按 type 分发到对应 handler
          switch (event.type) {
            case "thinking":
              handlers.onThinking();
              break;
            case "model_select":
              handlers.onModelSelect(event.model, event.intent);
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
        };

        // 读取流
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          pendingText += decoder.decode(value, { stream: true });
          const blocks = pendingText.split(/\n\n/);
          pendingText = blocks.pop() ?? "";

          for (const block of blocks) {
            const event = parseSSEBlock(block);
            if (!event) continue;
            dispatchEvent(event);
          }
        }

        pendingText += decoder.decode();
        const trailingEvent = parseSSEBlock(pendingText.trim());
        if (trailingEvent) {
          dispatchEvent(trailingEvent);
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
