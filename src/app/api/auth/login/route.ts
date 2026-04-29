/**
 * 用户登录 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 验证输入
    if (!email || !password) {
      return Response.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 检查用户状态
    if (!user.enabled) {
      return Response.json({ error: "账号已被禁用" }, { status: 403 });
    }

    // 验证密码
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return Response.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 生成 tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 存储 refresh token（可以清理旧的）
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: randomBytes(32).toString("hex"),
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 返回响应
    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
    });

    // 设置 httpOnly cookie
    response.headers.set(
      "Set-Cookie",
      `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`
    );

    return response;
  } catch (error) {
    console.error("[Login] Error:", error);
    return Response.json({ error: "登录失败" }, { status: 500 });
  }
}
