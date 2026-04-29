/**
 * 会话管理 Hooks (TanStack Query)
 *
 * 职责：会话 CRUD 操作的数据获取和缓存管理
 * - useSessions: 获取会话列表
 * - useSessionMessages: 获取会话消息
 * - useCreateSession: 创建新会话
 * - useDeleteSession: 删除会话
 *
 * 与 Zustand Store 配合：
 * - Query 负责数据获取、缓存、同步
 * - Store 负责 UI 状态（activeSessionId）
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTokenStore } from "./use-auth";

// ============================================================
// Types
// ============================================================

export interface Session {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: Array<{
    tool: string;
    args: Record<string, unknown>;
    result: string;
  }>;
  metadata?: {
    model?: string;
    intent?: string;
  };
  createdAt: string;
}

// ============================================================
// Query Keys
// ============================================================

export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: () => [...sessionKeys.lists()] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
  messages: (id: string) => [...sessionKeys.detail(id), "messages"] as const,
};

// ============================================================
// API Functions
// ============================================================

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const accessToken = useTokenStore.getState().accessToken;

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `请求失败: ${res.status}`);
  }

  // 204 No Content
  if (res.status === 204) {
    return null;
  }

  return res.json();
}

const sessionApi = {
  /** 获取会话列表 */
  async list(): Promise<{ sessions: Session[] }> {
    return fetchWithAuth("/api/sessions");
  },

  /** 获取会话详情 */
  async get(id: string): Promise<Session> {
    return fetchWithAuth(`/api/sessions/${id}`);
  },

  /** 创建会话 */
  async create(): Promise<Session> {
    return fetchWithAuth("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  },

  /** 删除会话 */
  async delete(id: string): Promise<void> {
    await fetchWithAuth(`/api/sessions/${id}`, { method: "DELETE" });
  },

  /** 获取会话消息 */
  async getMessages(id: string): Promise<{ messages: SessionMessage[] }> {
    return fetchWithAuth(`/api/sessions/${id}/messages`);
  },
};

// ============================================================
// Hooks
// ============================================================

/**
 * 获取会话列表
 */
export function useSessions() {
  const accessToken = useTokenStore((s) => s.accessToken);

  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: sessionApi.list,
    enabled: !!accessToken,
    staleTime: 30 * 1000, // 30 秒
    select: (data) => data.sessions,
  });
}

/**
 * 获取会话详情
 */
export function useSession(id: string | null) {
  const accessToken = useTokenStore((s) => s.accessToken);

  return useQuery({
    queryKey: sessionKeys.detail(id || ""),
    queryFn: () => sessionApi.get(id!),
    enabled: !!accessToken && !!id,
    staleTime: 60 * 1000, // 1 分钟
  });
}

/**
 * 获取会话消息
 */
export function useSessionMessages(sessionId: string | null) {
  const accessToken = useTokenStore((s) => s.accessToken);

  return useQuery({
    queryKey: sessionKeys.messages(sessionId || ""),
    queryFn: () => sessionApi.getMessages(sessionId!),
    enabled: !!accessToken && !!sessionId,
    staleTime: 0, // 总是重新获取
    select: (data) => data.messages,
  });
}

/**
 * 创建会话
 */
export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionApi.create,
    onSuccess: (newSession) => {
      // 乐观更新：把新会话插入列表头部
      queryClient.setQueryData<{ sessions: Session[] }>(
        sessionKeys.list(),
        (old) => {
          if (!old) return { sessions: [newSession] };
          return { sessions: [newSession, ...old.sessions] };
        }
      );
    },
  });
}

/**
 * 删除会话
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionApi.delete,
    onSuccess: (_, deletedId) => {
      // 乐观更新：从列表中移除
      queryClient.setQueryData<{ sessions: Session[] }>(
        sessionKeys.list(),
        (old) => {
          if (!old) return { sessions: [] };
          return {
            sessions: old.sessions.filter((s) => s.id !== deletedId),
          };
        }
      );
      // 清除该会话的消息缓存
      queryClient.removeQueries({
        queryKey: sessionKeys.messages(deletedId),
      });
    },
  });
}
