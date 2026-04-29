/**
 * 会话管理 API
 *
 * GET  /api/sessions - 获取当前用户的会话列表（支持游标分页）
 * POST /api/sessions - 创建新会话
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";

const PAGE_SIZE = 20;

/**
 * 获取会话列表（游标分页）
 *
 * Query params:
 * - cursor: 上一页最后一条的 id（可选）
 * - limit: 每页数量（默认 20，最大 50）
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10),
      50
    );

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
      take: limit + 1, // 多取一条判断是否有下一页
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // 跳过 cursor 本身
      }),
    });

    // 判断是否有下一页
    const hasMore = sessions.length > limit;
    const items = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return Response.json({
      sessions: items,
      nextCursor,
      hasMore,
    });
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
