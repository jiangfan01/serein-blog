/**
 * Agent SSE 事件类型定义
 *
 * 统一的数据协议，前端和后端都用这套类型。
 * 以后加新功能（session、记忆、多 Agent）都在这里扩展，不用改 route.ts。
 *
 * 设计思路：
 * - type 字段做区分，前端用 switch(event.type) 分发处理
 * - 每种事件只携带自己需要的数据，不搞大而全的对象
 */

// 文本流式输出 — 逐 token 推送，前端拼接显示
export interface TextDeltaEvent {
  type: "text_delta";
  content: string;
}

// 工具开始调用 — 前端可以显示"正在搜索..."
export interface ToolStartEvent {
  type: "tool_start";
  tool: string; // 工具名，如 "rag_search"
  args: Record<string, unknown>; // 工具参数，如 { query: "React hooks" }
}

// 工具调用完成 — 前端可以显示"搜索完成"
export interface ToolEndEvent {
  type: "tool_end";
  tool: string;
  result: string; // 工具返回的结果摘要
}

// 错误事件
export interface ErrorEvent {
  type: "error";
  message: string;
}

// 思考中事件 — 模型开始处理，还没输出内容
export interface ThinkingEvent {
  type: "thinking";
}

// 模型选择事件 — 告诉前端用了哪个模型
export interface ModelSelectEvent {
  type: "model_select";
  model: string; // 模型名，如 "deepseek-v4-flash"
  intent: string; // 意图分类，如 "rag_query"
}

// 结束事件
export interface DoneEvent {
  type: "done";
}

// 执行开始事件 — 返回 executionId 用于断线重连
export interface ExecutionStartEvent {
  type: "execution_start";
  executionId: string;
}

// 联合类型 — 所有可能的 SSE 事件
export type SSEEvent =
  | TextDeltaEvent
  | ToolStartEvent
  | ToolEndEvent
  | ThinkingEvent
  | ModelSelectEvent
  | ErrorEvent
  | DoneEvent
  | ExecutionStartEvent;
