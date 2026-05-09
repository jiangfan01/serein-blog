/**
 * 用户相关类型定义
 */

/**
 * 用户角色
 */
export type UserRole = "user" | "admin";

/**
 * 用户基本信息
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  responseStyle: string;
}

/**
 * 用户权限
 */
export interface UserPermissions {
  canUseChat: boolean;
  dailyLimit: number;
  todayUsage: number;
}
