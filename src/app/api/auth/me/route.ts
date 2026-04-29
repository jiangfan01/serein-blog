/**
 * 获取当前用户信息 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 从 header 获取 access token
    const token = extractToken(req.headers.get("Authorization"));

    if (!token) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    // 验证 token
    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Token 已过期" }, { status: 401 });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error("[Me] Error:", error);
    return Response.json({ error: "获取用户信息失败" }, { status: 500 });
  }
}
