/**
 * 修改密码 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, extractToken, hashPassword, verifyPassword } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  try {
    // 验证登录
    const token = extractToken(req.headers.get("Authorization"));
    if (!token) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Token 已过期" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return Response.json({ error: "请输入旧密码和新密码" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ error: "新密码至少 6 位" }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return Response.json({ error: "用户不存在" }, { status: 404 });
    }

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: "旧密码错误" }, { status: 400 });
    }

    // 更新密码
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return Response.json({ success: true, message: "密码修改成功" });
  } catch (error) {
    console.error("[Password] Error:", error);
    return Response.json({ error: "修改失败" }, { status: 500 });
  }
}
