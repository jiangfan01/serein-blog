/**
 * 会话管理 API
 *
 * GET  /api/sessions - 获取当前用户的会话列表
 * POST /api/sessions - 创建新会话
 */
import { NextRequest } from "next/server";
import { verifyAuth, authError } from "@/lib/auth/middleware";
import { getUserSessions, createSession } from "@/lib/services";

/**
 * 获取会话列表（游标分页）
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await getUserSessions(auth.userId, { cursor, limit });

    return Response.json({
      sessions: result.sessions,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
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

    const session = await createSession(auth.userId);

    return Response.json(session, { status: 201 });
  } catch (error) {
    console.error("[Sessions POST] Error:", error);
    return Response.json({ error: "创建会话失败" }, { status: 500 });
  }
}
