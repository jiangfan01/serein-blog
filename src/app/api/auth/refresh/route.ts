/**
 * 刷新 Token API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, generateAccessToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 从 cookie 获取 refresh token
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    // 验证 token
    const payload = verifyToken(refreshToken);
    if (!payload) {
      return Response.json({ error: "Token 已过期" }, { status: 401 });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.enabled) {
      return Response.json({ error: "用户不存在或已禁用" }, { status: 401 });
    }

    // 生成新的 access token
    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(newPayload);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("[Refresh] Error:", error);
    return Response.json({ error: "刷新失败" }, { status: 500 });
  }
}
