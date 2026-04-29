/**
 * 单个会话管理 API
 *
 * GET    /api/sessions/:id - 获取会话详情
 * PATCH  /api/sessions/:id - 更新会话（标题等）
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
 * 更新会话（标题等）
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id } = await params;
    const body = await req.json();

    // 验证请求体
    const { title } = body;
    if (title !== undefined && typeof title !== "string") {
      return Response.json({ error: "标题格式错误" }, { status: 400 });
    }

    // 标题长度限制
    if (title && title.length > 100) {
      return Response.json({ error: "标题不能超过 100 字符" }, { status: 400 });
    }

    // 检查会话是否存在且属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id,
        userId: auth.userId,
      },
    });

    if (!session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    // 更新会话
    const updated = await prisma.chatSession.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title || null }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("[Session PATCH] Error:", error);
    return Response.json({ error: "更新会话失败" }, { status: 500 });
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
