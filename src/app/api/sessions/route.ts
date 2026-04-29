/**
 * 会话管理 API
 *
 * GET  /api/sessions - 获取当前用户的所有会话
 * POST /api/sessions - 创建新会话
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";

/**
 * 获取会话列表
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: auth.userId,
        archived: false,
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json({ sessions });
  } catch (error) {
    console.error("[Sessions GET] Error:", error);
    return Response.json({ error: "获取会话列表失败" }, { status: 500 });
  }
}

/**
 * 创建新会话
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const session = await prisma.chatSession.create({
      data: {
        userId: auth.userId,
        title: null,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(session, { status: 201 });
  } catch (error) {
    console.error("[Sessions POST] Error:", error);
    return Response.json({ error: "创建会话失败" }, { status: 500 });
  }
}
