/**
 * 聊天相关类型定义
 */

/**
 * 会话状态
 */
export type SessionStatus = "idle" | "running" | "interrupted";

/**
 * 会话列表项
 */
export interface Session {
  id: string;
  title: string | null;
  updatedAt: Date;
  replyStatus: SessionStatus;
}

/**
 * 消息角色
 */
export type MessageRole = "user" | "assistant" | "system" | "tool";

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  metadata?: MessageMetadata;
  createdAt: Date;
}

/**
 * 工具调用
 */
export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  model?: string;
  intent?: string;
  interrupted?: boolean;
  tokens?: {
    input: number;
    output: number;
  };
}

/**
 * 执行状态
 */
export type ExecutionStatus =
  | "running"
  | "completed"
  | "failed"
  | "paused"
  | "interrupted";

/**
 * 执行记录
 */
export interface Execution {
  id: string;
  sessionId: string;
  status: ExecutionStatus;
  progress?: ExecutionProgress;
  result?: ExecutionResult;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
}

/**
 * 执行进度
 */
export interface ExecutionProgress {
  phase: "generating" | "tool_calling" | "interrupted";
  partialContent: string;
  toolCalls: ToolCall[];
  metadata: MessageMetadata;
}

/**
 * 执行结果
 */
export interface ExecutionResult {
  messageId?: string;
  content?: string;
  toolCalls?: ToolCall[];
  metadata?: MessageMetadata;
  error?: string;
}
