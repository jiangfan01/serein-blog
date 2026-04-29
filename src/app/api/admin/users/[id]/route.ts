/**
 * 单个用户操作 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

/**
 * 更新用户（启用/禁用聊天权限、调整配额）
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await verifyAdmin(req);
    if (authError) return authError;

    const { id } = await params;
    const { canUseChat, dailyLimit, enabled } = await req.json();

    const updateData: Record<string, unknown> = {};
    if (typeof canUseChat === "boolean") updateData.canUseChat = canUseChat;
    if (typeof dailyLimit === "number") updateData.dailyLimit = dailyLimit;
    if (typeof enabled === "boolean") updateData.enabled = enabled;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        canUseChat: true,
        dailyLimit: true,
        enabled: true,
      },
    });

    return Response.json({ user });
  } catch (error) {
    console.error("[User PATCH] Error:", error);
    return Response.json({ error: "更新失败" }, { status: 500 });
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
