/**
 * 用户服务层
 *
 * 处理用户相关的业务逻辑：
 * - 权限验证
 * - 配额检查
 * - 偏好管理
 */

import { prisma } from "@/lib/prisma";

/**
 * 用户访问权限检查结果
 */
export interface UserAccessResult {
  allowed: boolean;
  error?: string;
  status?: number;
  user?: {
    id: string;
    responseStyle: string;
    dailyLimit: number;
    todayUsage: number;
  };
}

/**
 * 检查用户是否有权限使用聊天功能
 *
 * 检查项：
 * 1. 用户是否存在且启用
 * 2. 是否有聊天权限
 * 3. 是否超过每日配额
 */
export async function checkUserChatAccess(userId: string): Promise<UserAccessResult> {
  // 查询用户
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      enabled: true,
      canUseChat: true,
      dailyLimit: true,
      responseStyle: true,
    },
  });

  if (!user || !user.enabled) {
    return {
      allowed: false,
      error: "账号不存在或已被禁用",
      status: 403,
    };
  }

  if (!user.canUseChat) {
    return {
      allowed: false,
      error: "您没有使用聊天功能的权限",
      status: 403,
    };
  }

  // 检查每日配额
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.modelCallLog.count({
    where: {
      sessionId: { startsWith: user.id },
      createdAt: { gte: today },
    },
  });

  if (todayUsage >= user.dailyLimit) {
    return {
      allowed: false,
      error: `今日调用次数已达上限（${user.dailyLimit}次），请明天再试`,
      status: 429,
    };
  }

  return {
    allowed: true,
    user: {
      id: user.id,
      responseStyle: user.responseStyle,
      dailyLimit: user.dailyLimit,
      todayUsage,
    },
  };
}

/**
 * 获取用户偏好设置
 */
export async function getUserPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      responseStyle: true,
    },
  });

  return user;
}

/**
 * 更新用户偏好设置
 */
export async function updateUserPreferences(
  userId: string,
  data: { responseStyle?: string }
) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.responseStyle && { responseStyle: data.responseStyle }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      responseStyle: true,
    },
  });

  return updated;
}
