/**
 * 用户偏好设置 API
 * 
 * GET  /api/user/preferences - 获取当前用户偏好
 * PATCH /api/user/preferences - 更新用户偏好
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth, authError } from "@/lib/auth/middleware";
import { isValidStyleKey } from "@/lib/response-styles";

/**
 * 获取用户偏好
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        responseStyle: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 404 });
    }

    return Response.json({
      responseStyle: user.responseStyle,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (err) {
    console.error("[User Preferences GET] Error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}

/**
 * 更新用户偏好
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const body = await req.json();
    const { responseStyle } = body;

    // 验证 responseStyle
    if (responseStyle !== undefined) {
      if (typeof responseStyle !== "string" || !isValidStyleKey(responseStyle)) {
        return Response.json(
          { error: "无效的回答风格" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(responseStyle !== undefined && { responseStyle }),
      },
      select: {
        responseStyle: true,
      },
    });

    return Response.json(user);
  } catch (err) {
    console.error("[User Preferences PATCH] Error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
