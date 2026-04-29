/**
 * 会话消息 API
 *
 * GET /api/sessions/:id/messages - 获取会话的所有消息
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 获取会话消息列表
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id: sessionId } = await params;

    // 先验证会话归属
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: auth.userId,
      },
    });

    if (!session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    // 获取消息列表，按创建时间升序排列
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
      },
      select: {
        id: true,
        role: true,
        content: true,
        toolCalls: true,
        toolCallId: true,
        toolName: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return Response.json({ messages });
  } catch (error) {
    console.error("[Messages GET] Error:", error);
    return Response.json({ error: "获取消息失败" }, { status: 500 });
  }
}
