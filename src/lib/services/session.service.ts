/**
 * 会话服务层
 *
 * 处理会话相关的业务逻辑：
 * - 会话 CRUD
 * - 会话归属验证
 * - 会话状态管理
 */

import { prisma } from "@/lib/prisma";

/**
 * 会话列表项
 */
export interface SessionListItem {
  id: string;
  title: string | null;
  updatedAt: Date;
  replyStatus: "idle" | "running" | "interrupted";
}

/**
 * 会话列表分页结果
 */
export interface SessionListResult {
  sessions: SessionListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * 获取用户的会话列表（游标分页）
 */
export async function getUserSessions(
  userId: string,
  options: { cursor?: string; limit?: number } = {}
): Promise<SessionListResult> {
  const { cursor, limit = 20 } = options;
  const safeLimit = Math.min(limit, 50);

  const sessions = await prisma.chatSession.findMany({
    where: {
      userId,
      archived: false,
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      executions: {
        select: { status: true },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: safeLimit + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = sessions.length > safeLimit;
  const items = hasMore ? sessions.slice(0, safeLimit) : sessions;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    sessions: items.map((s) => {
      const latestStatus = s.executions[0]?.status;
      const replyStatus =
        latestStatus === "running" || latestStatus === "interrupted"
          ? (latestStatus as "running" | "interrupted")
          : "idle";

      return {
        id: s.id,
        title: s.title,
        updatedAt: s.updatedAt,
        replyStatus,
      };
    }),
    nextCursor,
    hasMore,
  };
}

/**
 * 创建新会话
 */
export async function createSession(userId: string) {
  const session = await prisma.chatSession.create({
    data: {
      userId,
      title: null,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return session;
}

/**
 * 获取会话详情（验证归属）
 */
export async function getSession(sessionId: string, userId: string) {
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return session;
}

/**
 * 验证会话归属
 */
export async function verifySessionOwnership(
  sessionId: string,
  userId: string
): Promise<{ valid: boolean; session?: { id: string; title: string | null } }> {
  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  return session ? { valid: true, session } : { valid: false };
}

/**
 * 更新会话
 */
export async function updateSession(
  sessionId: string,
  userId: string,
  data: { title?: string | null }
) {
  // 先验证归属
  const exists = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!exists) {
    return null;
  }

  const updated = await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      updatedAt: new Date(),
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

/**
 * 删除会话（级联删除消息和执行记录）
 */
export async function deleteSession(
  sessionId: string,
  userId: string
): Promise<boolean> {
  // 先验证归属
  const exists = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!exists) {
    return false;
  }

  await prisma.chatSession.delete({
    where: { id: sessionId },
  });

  return true;
}

/**
 * 更新会话标题（首条消息时自动生成）
 */
export async function updateSessionTitle(sessionId: string, title: string) {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
}

/**
 * 更新会话的 updatedAt
 */
export async function touchSession(sessionId: string) {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });
}
