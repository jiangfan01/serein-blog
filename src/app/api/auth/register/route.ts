/**
 * 用户注册 API
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // 验证输入
    if (!email || !password) {
      return Response.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json({ error: "该邮箱已注册" }, { status: 400 });
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || email.split("@")[0],
      },
    });

    // 生成 tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // 存储 refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: randomBytes(32).toString("hex"),
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // 设置 refresh token cookie
    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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
    console.error("[Register] Error:", error);
    return Response.json({ error: "注册失败" }, { status: 500 });
  }
}
