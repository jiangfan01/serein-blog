/**
 * 登出 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 从 cookie 获取 refresh token
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (refreshToken) {
      // 验证并删除数据库中的 token
      const payload = verifyToken(refreshToken);
      if (payload) {
        await prisma.refreshToken.deleteMany({
          where: { userId: payload.userId },
        });
      }
    }

    // 清除 cookie
    const response = Response.json({ success: true });
    response.headers.set(
      "Set-Cookie",
      "refreshToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    );

    return response;
  } catch (error) {
    console.error("[Logout] Error:", error);
    return Response.json({ error: "登出失败" }, { status: 500 });
  }
}
