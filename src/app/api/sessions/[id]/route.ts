/**
 * 单个会话管理 API
 *
 * GET    /api/sessions/:id - 获取会话详情
 * PATCH  /api/sessions/:id - 更新会话
 * DELETE /api/sessions/:id - 删除会话
 */
import { NextRequest } from "next/server";
import { verifyAuth, authError } from "@/lib/auth/middleware";
import { getSession, updateSession, deleteSession } from "@/lib/services";
import { SESSION_TITLE_MAX_LENGTH } from "@/lib/config/constants";

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
    const session = await getSession(id, auth.userId);

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
 * 更新会话
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

    if (title && title.length > SESSION_TITLE_MAX_LENGTH) {
      return Response.json(
        { error: `标题不能超过 ${SESSION_TITLE_MAX_LENGTH} 字符` },
        { status: 400 }
      );
    }

    const updated = await updateSession(id, auth.userId, {
      title: title !== undefined ? title || null : undefined,
    });

    if (!updated) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    console.error("[Session PATCH] Error:", error);
    return Response.json({ error: "更新会话失败" }, { status: 500 });
  }
}

/**
 * 删除会话
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id } = await params;
    const deleted = await deleteSession(id, auth.userId);

    if (!deleted) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[Session DELETE] Error:", error);
    return Response.json({ error: "删除会话失败" }, { status: 500 });
  }
}
