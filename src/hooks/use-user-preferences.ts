/**
 * 用户偏好设置 Hook
 * 
 * 管理用户的回答风格等偏好设置
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTokenStore } from "./use-auth";
import type { ResponseStyleKey } from "@/lib/response-styles";

interface UserPreferences {
  responseStyle: ResponseStyleKey;
  name: string | null;
  email: string;
  avatar: string | null;
}

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

  return res.json();
}

export const userPreferencesKeys = {
  all: ["userPreferences"] as const,
  current: () => [...userPreferencesKeys.all, "current"] as const,
};

/**
 * 获取用户偏好
 */
export function useUserPreferences() {
  const accessToken = useTokenStore((s) => s.accessToken);

  return useQuery({
    queryKey: userPreferencesKeys.current(),
    queryFn: () => fetchWithAuth("/api/user/preferences") as Promise<UserPreferences>,
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}

/**
 * 更新用户偏好
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Pick<UserPreferences, "responseStyle">>) => {
      return fetchWithAuth("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }) as Promise<Pick<UserPreferences, "responseStyle">>;
    },
    onMutate: async (newData) => {
      // 取消正在进行的请求
      await queryClient.cancelQueries({ queryKey: userPreferencesKeys.current() });

      // 保存旧数据
      const previousData = queryClient.getQueryData<UserPreferences>(
        userPreferencesKeys.current()
      );

      // 乐观更新
      if (previousData) {
        queryClient.setQueryData<UserPreferences>(userPreferencesKeys.current(), {
          ...previousData,
          ...newData,
        });
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      // 回滚
      if (context?.previousData) {
        queryClient.setQueryData(userPreferencesKeys.current(), context.previousData);
      }
    },
    onSettled: () => {
      // 重新获取最新数据
      queryClient.invalidateQueries({ queryKey: userPreferencesKeys.current() });
    },
  });
}
