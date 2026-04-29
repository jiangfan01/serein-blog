"use client";

/**
 * 认证状态管理 Hook
 * 
 * 使用 Zustand 管理全局认证状态
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,
      
      setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
      clearAuth: () => set({ user: null, accessToken: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    }
  )
);

/**
 * 认证 API 封装
 */
export const authApi = {
  async login(email: string, password: string) {
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
  
  async register(email: string, password: string, name?: string) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "注册失败");
    }
    
    return res.json();
  },
  
  async logout() {
    await fetch("/api/auth/logout", { method: "POST" });
  },
  
  async refresh() {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    
    if (!res.ok) {
      throw new Error("Token 刷新失败");
    }
    
    return res.json();
  },
  
  async getMe(accessToken: string) {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      throw new Error("获取用户信息失败");
    }
    
    return res.json();
  },
};

/**
 * 认证 Hook
 */
export function useAuth() {
  const { user, accessToken, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  
  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAuth(data.user, data.accessToken);
    return data;
  };
  
  const register = async (email: string, password: string, name?: string) => {
    const data = await authApi.register(email, password, name);
    setAuth(data.user, data.accessToken);
    return data;
  };
  
  const logout = async () => {
    await authApi.logout();
    clearAuth();
  };
  
  const refreshToken = async () => {
    try {
      const data = await authApi.refresh();
      setAuth(data.user, data.accessToken);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  };
  
  // 初始化时尝试刷新 token
  const initAuth = async () => {
    setLoading(true);
    try {
      await refreshToken();
    } catch {
      clearAuth();
    }
  };
  
  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    initAuth,
  };
}
