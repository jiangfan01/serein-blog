/**
 * 会话管理 Hooks (TanStack Query)
 *
 * 职责：会话 CRUD 操作的数据获取和缓存管理
 * - useInfiniteSessions: 无限滚动获取会话列表
 * - useSessionMessages: 获取会话消息
 * - useCreateSession: 创建新会话
 * - useDeleteSession: 删除会话
 *
 * 与 Zustand Store 配合：
 * - Query 负责数据获取、缓存、同步
 * - Store 负责 UI 状态（activeSessionId）
 */
"use client";

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTokenStore } from "./use-auth";

// ============================================================
// Types
// ============================================================

export interface Session {
  id: string;
  title: string | null;
  updatedAt: string;
  replyStatus: "idle" | "running" | "completed" | "failed" | "cancelled";
}

export interface SessionsPage {
  sessions: Session[];
  nextCursor: string | null;
  hasMore: boolean;
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
  infinite: () => [...sessionKeys.lists(), "infinite"] as const,
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
  /** 获取会话列表（分页） */
  async list(cursor?: string): Promise<SessionsPage> {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const url = `/api/sessions${params.toString() ? `?${params}` : ""}`;
    return fetchWithAuth(url);
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
 * 无限滚动获取会话列表
 * 
 * 缓存策略：
 * - staleTime: 1分钟内不重新请求
 * - 窗口聚焦时不自动刷新（避免打断用户操作）
 */
export function useInfiniteSessions() {
  const accessToken = useTokenStore((s) => s.accessToken);

  return useInfiniteQuery({
    queryKey: sessionKeys.infinite(),
    queryFn: ({ pageParam }) => sessionApi.list(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    enabled: !!accessToken,
    staleTime: 60 * 1000, // 1 分钟内不重新请求
    gcTime: 10 * 60 * 1000, // 10 分钟后垃圾回收
    refetchOnWindowFocus: false,
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
    staleTime: 60 * 1000,
  });
}

/**
 * 获取会话消息
 * 
 * 缓存策略：
 * - staleTime: 10分钟内认为数据新鲜，不重新请求
 * - gcTime: 30分钟后才清理缓存
 * - 切换会话时优先使用缓存，后台静默刷新
 */
export function useSessionMessages(sessionId: string | null) {
  const accessToken = useTokenStore((s) => s.accessToken);

  return useQuery({
    queryKey: sessionKeys.messages(sessionId || ""),
    queryFn: () => sessionApi.getMessages(sessionId!),
    enabled: !!accessToken && !!sessionId,
    staleTime: 10 * 60 * 1000, // 10 分钟内不重新请求
    gcTime: 30 * 60 * 1000, // 30 分钟后垃圾回收
    refetchOnWindowFocus: false, // 窗口聚焦不刷新
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
      // 乐观更新：把新会话插入无限列表的第一页头部
      queryClient.setQueryData<{
        pages: SessionsPage[];
        pageParams: (string | undefined)[];
      }>(sessionKeys.infinite(), (old) => {
        if (!old) {
          return {
            pages: [{ sessions: [newSession], nextCursor: null, hasMore: false }],
            pageParams: [undefined],
          };
        }
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0
              ? { ...page, sessions: [newSession, ...page.sessions] }
              : page
          ),
        };
      });
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
      // 乐观更新：从无限列表中移除
      queryClient.setQueryData<{
        pages: SessionsPage[];
        pageParams: (string | undefined)[];
      }>(sessionKeys.infinite(), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            sessions: page.sessions.filter((s) => s.id !== deletedId),
          })),
        };
      });
      // 清除该会话的消息缓存
      queryClient.removeQueries({
        queryKey: sessionKeys.messages(deletedId),
      });
    },
  });
}

/**
 * 乐观更新会话标题
 * 用于发送首条消息时立即更新侧边栏显示
 */
export function useOptimisticUpdateTitle() {
  const queryClient = useQueryClient();

  return (sessionId: string, title: string) => {
    queryClient.setQueryData<{
      pages: SessionsPage[];
      pageParams: (string | undefined)[];
    }>(sessionKeys.infinite(), (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          sessions: page.sessions.map((s) =>
            s.id === sessionId ? { ...s, title, updatedAt: new Date().toISOString() } : s
          ),
        })),
      };
    });
  };
}

/**
 * 更新会话标题（带 API 调用）
 * 用于用户手动编辑标题
 */
export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      return fetchWithAuth(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }) as Promise<Session>;
    },
    onMutate: async ({ id, title }) => {
      // 取消正在进行的请求
      await queryClient.cancelQueries({ queryKey: sessionKeys.infinite() });

      // 保存旧数据用于回滚
      const previousData = queryClient.getQueryData<{
        pages: SessionsPage[];
        pageParams: (string | undefined)[];
      }>(sessionKeys.infinite());

      // 乐观更新
      queryClient.setQueryData<{
        pages: SessionsPage[];
        pageParams: (string | undefined)[];
      }>(sessionKeys.infinite(), (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            sessions: page.sessions.map((s) =>
              s.id === id ? { ...s, title, updatedAt: new Date().toISOString() } : s
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      // 回滚
      if (context?.previousData) {
        queryClient.setQueryData(sessionKeys.infinite(), context.previousData);
      }
    },
  });
}

/**
 * 预取会话消息
 * 用于鼠标悬停时提前加载，减少切换延迟
 */
export function usePrefetchSessionMessages() {
  const queryClient = useQueryClient();
  const accessToken = useTokenStore((s) => s.accessToken);

  return (sessionId: string) => {
    if (!accessToken || !sessionId) return;

    // 检查是否已有缓存
    const cached = queryClient.getQueryData(sessionKeys.messages(sessionId));
    if (cached) return;

    // 预取
    queryClient.prefetchQuery({
      queryKey: sessionKeys.messages(sessionId),
      queryFn: () => sessionApi.getMessages(sessionId),
      staleTime: 10 * 60 * 1000,
    });
  };
}
