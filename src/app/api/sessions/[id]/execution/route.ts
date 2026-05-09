/**
 * 获取会话的最新执行状态
 * 
 * GET /api/sessions/{id}/execution
 * 
 * 用于断线重连：前端进入会话页面时检查是否有 running 的执行
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id: sessionId } = await params;

    // 验证会话归属
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: auth.userId,
      },
      select: { id: true },
    });

    if (!session) {
      return Response.json({ error: "会话不存在" }, { status: 404 });
    }

    // 查询最新的执行记录
    const execution = await prisma.chatExecution.findFirst({
      where: { sessionId },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        status: true,
        progress: true,
      },
    });

    if (!execution) {
      return Response.json({ executionId: null, status: "idle" });
    }

    return Response.json({
      executionId: execution.id,
      status: execution.status,
      progress: execution.progress,
    });
  } catch (err) {
    console.error("[Session Execution API] Error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
