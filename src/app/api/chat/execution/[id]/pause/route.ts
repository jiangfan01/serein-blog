/**
 * 暂停执行接口
 * 
 * POST /api/chat/execution/{id}/pause
 * 
 * 把执行状态改为 paused，前端轮询时会收到暂停状态
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const { id } = await params;

    // 查询执行记录并验证归属
    const execution = await prisma.chatExecution.findUnique({
      where: { id },
      include: {
        session: {
          select: { userId: true },
        },
      },
    });

    if (!execution) {
      return Response.json({ error: "执行记录不存在" }, { status: 404 });
    }

    if (execution.session.userId !== auth.userId) {
      return Response.json({ error: "无权操作" }, { status: 403 });
    }

    if (execution.status !== "running") {
      return Response.json({ error: "只能暂停运行中的执行" }, { status: 400 });
    }

    // 更新状态为 paused
    await prisma.chatExecution.update({
      where: { id },
      data: {
        status: "paused",
        pausedAt: new Date(),
      },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("[Pause Execution API] Error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
