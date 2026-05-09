/**
 * 用户偏好设置 API
 *
 * GET  /api/user/preferences - 获取当前用户偏好
 * PATCH /api/user/preferences - 更新用户偏好
 */
import { NextRequest } from "next/server";
import { verifyAuth, authError } from "@/lib/auth/middleware";
import { getUserPreferences, updateUserPreferences } from "@/lib/services";
import { isValidStyleKey } from "@/lib/config";

/**
 * 获取用户偏好
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (!auth.success) {
      return authError(auth);
    }

    const user = await getUserPreferences(auth.userId);

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
        return Response.json({ error: "无效的回答风格" }, { status: 400 });
      }
    }

    const user = await updateUserPreferences(auth.userId, { responseStyle });

    return Response.json({ responseStyle: user.responseStyle });
  } catch (err) {
    console.error("[User Preferences PATCH] Error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
