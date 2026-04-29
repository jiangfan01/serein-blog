/**
 * 用户管理 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

/**
 * 获取所有用户
 */
export async function GET(req: NextRequest) {
  try {
    const authError = await verifyAdmin(req);
    if (authError) return authError;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        canUseChat: true,
        dailyLimit: true,
        enabled: true,
        createdAt: true,
        lastLoginAt: true,
        inviteCode: {
          select: {
            code: true,
            note: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 获取每个用户今日调用次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usersWithUsage = await Promise.all(
      users.map(async (user) => {
        const todayUsage = await prisma.modelCallLog.count({
          where: {
            sessionId: { startsWith: user.id }, // 假设 sessionId 包含 userId
            createdAt: { gte: today },
          },
        });

        return {
          ...user,
          todayUsage,
        };
      })
    );

    return Response.json({ users: usersWithUsage });
  } catch (error) {
    console.error("[Users GET] Error:", error);
    return Response.json({ error: "获取失败" }, { status: 500 });
  }
}

async function verifyAdmin(req: NextRequest) {
  const token = extractToken(req.headers.get("Authorization"));

  if (!token) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return Response.json({ error: "Token 已过期" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }

  return null;
}
