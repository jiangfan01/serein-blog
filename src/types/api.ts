/**
 * API 相关类型定义
 */

/**
 * 通用 API 错误响应
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * SSE 事件类型（从 agent/types 重新导出）
 */
export type { SSEEvent } from "@/lib/agent/types";
