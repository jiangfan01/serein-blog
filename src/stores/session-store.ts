/**
 * 会话状态管理 Store (Zustand)
 *
 * 职责：管理当前活跃会话和侧边栏状态
 * - activeSessionId: 当前选中的会话 ID
 * - sidebarOpen: 侧边栏展开状态（移动端用）
 *
 * 与 TanStack Query 配合：
 * - Query 负责会话列表的获取、缓存、同步
 * - Store 只负责 UI 状态（哪个会话被选中、侧边栏开关）
 */
import { create } from "zustand";

interface SessionState {
  /** 当前活跃的会话 ID */
  activeSessionId: string | null;

  /** 侧边栏是否展开（移动端） */
  sidebarOpen: boolean;

  /** 设置当前活跃会话 */
  setActiveSession: (sessionId: string | null) => void;

  /** 切换侧边栏状态 */
  toggleSidebar: () => void;

  /** 设置侧边栏状态 */
  setSidebarOpen: (open: boolean) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSessionId: null,
  sidebarOpen: false,

  setActiveSession: (sessionId) =>
    set({ activeSessionId: sessionId }),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) =>
    set({ sidebarOpen: open }),
}));
