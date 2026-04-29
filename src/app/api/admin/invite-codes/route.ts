/**
 * 邀请码管理 API
 * 
 * 只有 admin 角色可以操作
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";
import { randomBytes } from "crypto";

/**
 * 获取所有邀请码
 */
export async function GET(req: NextRequest) {
  try {
    // 验证 admin 权限
    const authError = await verifyAdmin(req);
    if (authError) return authError;

    const inviteCodes = await prisma.inviteCode.findMany({
      include: {
        usedBy: {
          select: {
            id: true,
            email: true,
            name: true,
            canUseChat: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ inviteCodes });
  } catch (error) {
    console.error("[InviteCodes GET] Error:", error);
    return Response.json({ error: "获取失败" }, { status: 500 });
  }
}

/**
 * 创建邀请码
 */
export async function POST(req: NextRequest) {
  try {
    // 验证 admin 权限
    const authError = await verifyAdmin(req);
    if (authError) return authError;

    const { note, maxUses = 1, expiresInDays } = await req.json();

    // 生成随机邀请码
    const code = randomBytes(4).toString("hex").toUpperCase();

    const inviteCode = await prisma.inviteCode.create({
      data: {
        code,
        note,
        maxUses,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    return Response.json({ inviteCode });
  } catch (error) {
    console.error("[InviteCodes POST] Error:", error);
    return Response.json({ error: "创建失败" }, { status: 500 });
  }
}

/**
 * 验证 admin 权限
 */
async function verifyAdmin(req: NextRequest) {
  const token = extractToken(req.headers.get("Authorization"));

  if (!token) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return Response.json({ error: "Token 已过期" }, { status: 401 });
  }

  // 检查是否是 admin
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { role: true },
  });

  if (user?.role !== "admin") {
    return Response.json({ error: "无权限" }, { status: 403 });
  }

  return null;
}
