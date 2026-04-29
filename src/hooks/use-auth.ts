"use client";

/**
 * 认证状态管理 Hook
 *
 * 使用 TanStack Query + Zustand 管理认证状态
 * - TanStack Query: 处理 API 请求、缓存、自动刷新
 * - Zustand: 存储 accessToken（内存）
 */
import { create } from "zustand";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================================
// Types
// ============================================================

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  canUseChat?: boolean;
}

interface AuthResponse {
  user: User;
  accessToken: string;
}

// ============================================================
// Token Store (Zustand) - 只存 accessToken
// ============================================================

interface TokenState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
}));

// ============================================================
// Auth API
// ============================================================

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "登录失败");
    }

    return res.json();
  },

  async register(
    email: string,
    password: string,
    name?: string,
    inviteCode?: string
  ): Promise<AuthResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, inviteCode }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "注册失败");
    }

    return res.json();
  },

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
  },

  async refresh(): Promise<AuthResponse> {
    const res = await fetch("/api/auth/refresh", { method: "POST" });

    if (!res.ok) {
      throw new Error("Token 刷新失败");
    }

    return res.json();
  },

  async changePassword(oldPassword: string, newPassword: string, accessToken: string): Promise<void> {
    const res = await fetch("/api/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "修改密码失败");
    }
  },
};

// ============================================================
// Query Keys
// ============================================================

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// ============================================================
// useAuth Hook
// ============================================================

export function useAuth() {
  const queryClient = useQueryClient();
  const { accessToken, setAccessToken } = useTokenStore();

  // 用户信息查询（通过 refresh token 获取）
  const {
    data: user,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const data = await authApi.refresh();
      setAccessToken(data.accessToken);
      return data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 分钟
    refetchOnWindowFocus: false,
  });

  // 登录
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(authKeys.user(), data.user);
    },
  });

  // 注册
  const registerMutation = useMutation({
    mutationFn: ({
      email,
      password,
      name,
      inviteCode,
    }: {
      email: string;
      password: string;
      name?: string;
      inviteCode?: string;
    }) => authApi.register(email, password, name, inviteCode),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(authKeys.user(), data.user);
    },
  });

  // 登出
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setAccessToken(null);
      queryClient.setQueryData(authKeys.user(), null);
      queryClient.removeQueries({ queryKey: authKeys.user() });
    },
  });

  // 修改密码
  const changePasswordMutation = useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) => {
      if (!accessToken) throw new Error("未登录");
      return authApi.changePassword(oldPassword, newPassword, accessToken);
    },
  });

  return {
    // 状态
    user: user ?? null,
    accessToken,
    isLoading,
    isError,
    isAuthenticated: !!user,

    // 操作
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    refetch,

    // Mutation 状态
    loginPending: loginMutation.isPending,
    registerPending: registerMutation.isPending,
    logoutPending: logoutMutation.isPending,
    changePasswordPending: changePasswordMutation.isPending,

    // 错误
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
