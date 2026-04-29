/**
 * 用户注册 API
 * 
 * 需要有效的邀请码才能注册
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateAccessToken, generateRefreshToken, getRefreshTokenExpiry } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, inviteCode } = await req.json();

    // 验证输入
    if (!email || !password) {
      return Response.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    if (!inviteCode) {
      return Response.json({ error: "请输入邀请码" }, { status: 400 });
    }

    // 验证邀请码
    const invite = await prisma.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!invite) {
      return Response.json({ error: "邀请码无效" }, { status: 400 });
    }

    if (!invite.enabled) {
      return Response.json({ error: "邀请码已禁用" }, { status: 400 });
    }

    if (invite.usedCount >= invite.maxUses) {
      return Response.json({ error: "邀请码已被使用" }, { status: 400 });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return Response.json({ error: "邀请码已过期" }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json({ error: "该邮箱已注册" }, { status: 400 });
    }

    // 创建用户（使用事务）
    const passwordHash = await hashPassword(password);
    
    const user = await prisma.$transaction(async (tx) => {
      // 创建用户
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split("@")[0],
          canUseChat: true, // 有邀请码的用户可以使用聊天
          inviteCodeId: invite.id,
        },
      });

      // 更新邀请码使用次数
      await tx.inviteCode.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
      });

      return newUser;
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

    // 返回响应
    const response = Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        canUseChat: user.canUseChat,
        dailyLimit: user.dailyLimit,
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
