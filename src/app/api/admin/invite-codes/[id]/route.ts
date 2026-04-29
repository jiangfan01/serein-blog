/**
 * 单个邀请码操作 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

/**
 * 删除/禁用邀请码
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await verifyAdmin(req);
    if (authError) return authError;

    const { id } = await params;

    await prisma.inviteCode.update({
      where: { id },
      data: { enabled: false },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[InviteCode DELETE] Error:", error);
    return Response.json({ error: "操作失败" }, { status: 500 });
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
