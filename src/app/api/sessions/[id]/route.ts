/**
 * 单个会话管理 API
 *
 * GET    /api/sessions/:id - 获取会话详情
 * DELETE /api/sessions/:id - 删除会话
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取会话详情
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id } = await params;

    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        userId: auth.userId, // 确保只能访问自己的会话
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 不存在或不属于当前用户，统一返回 404（避免信息泄露）
    if (!session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    return Response.json(session);
  } catch (error) {
    console.error("[Session GET] Error:", error);
    return Response.json({ error: "获取会话失败" }, { status: 500 });
  }
}

/**
 * 删除会话
 * Prisma schema 已配置级联删除，会自动删除关联的消息和执行记录
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id } = await params;

    // 先检查会话是否存在且属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    });

    if (!session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    // 删除会话（级联删除消息和执行记录）
    await prisma.chatSession.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[Session DELETE] Error:", error);
    return Response.json({ error: "删除会话失败" }, { status: 500 });
  }
}
