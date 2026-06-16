/**
 * 用户注册 API
 * 
 * 需要有效的邀请码才能注册
 */
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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
      include: { usedBy: { select: { id: true } } },
    });

    if (!invite) {
      return Response.json({ error: "邀请码无效" }, { status: 400 });
    }

    if (!invite.enabled) {
      return Response.json({ error: "邀请码已禁用" }, { status: 400 });
    }

    // 一码一人：被消费过 = 已经绑定了某个用户（usedBy 关系是唯一真相来源）
    if (invite.usedBy) {
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

    // 创建用户。
    // 注意：把 inviteCodeId 设到用户身上，这一个写操作本身就完成了"消费邀请码"。
    // 不再需要事务 + usedCount 自增——因为是一码一人，消费 = 单次写入。
    //
    // 并发兜底：User.inviteCodeId 上有 @unique。万一两个请求同时通过了上面的
    // usedBy 检查，数据库只会让一个 create 成功，另一个抛唯一约束冲突(P2002)，
    // 被下面的 catch 拦成友好的 400。数据库约束就是这里的"并发锁"。
    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || email.split("@")[0],
          canUseChat: true, // 有邀请码的用户可以使用聊天
          inviteCodeId: invite.id,
        },
      });
    } catch (e) {
      // P2002 = 唯一约束冲突（邀请码被并发抢用，或邮箱被并发抢注）
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        return Response.json(
          { error: "邀请码已被使用或邮箱已注册" },
          { status: 400 }
        );
      }
      throw e;
    }

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
