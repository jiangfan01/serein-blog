/**
 * 执行状态查询接口
 * 
 * 用于断线重连：前端轮询获取执行进度或最终结果
 * 
 * GET /api/chat/execution/{id}
 * 
 * 返回：
 * - running: { status, progress: { phase, partialContent, toolCalls, metadata } }
 * - completed: { status, result: { content, toolCalls, metadata } }
 * - failed: { status, error }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // 验证 Token
    const token = extractToken(req.headers.get("Authorization"));
    if (!token) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "登录已过期" }, { status: 401 });
    }

    const { id } = await params;

    // 查询执行记录
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

    // 验证归属
    if (execution.session.userId !== payload.userId) {
      return Response.json({ error: "无权访问" }, { status: 403 });
    }

    // 根据状态返回不同内容
    switch (execution.status) {
      case "running":
        return Response.json({
          status: "running",
          progress: execution.progress || {
            phase: "thinking",
            partialContent: "",
            toolCalls: [],
            metadata: {},
          },
        });

      case "completed":
        return Response.json({
          status: "completed",
          result: execution.result,
        });

      case "failed":
        return Response.json({
          status: "failed",
          error: (execution.result as { error?: string })?.error || "执行失败",
        });

      default:
        return Response.json({
          status: execution.status,
        });
    }
  } catch (err) {
    console.error("[Execution API] Error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
