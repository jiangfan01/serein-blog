/**
 * 认证中间件工具函数
 *
 * 用于 API 路由中验证用户身份
 */
import { NextRequest } from "next/server";
import { verifyToken, extractToken } from "./jwt";

export interface AuthSuccess {
  success: true;
  userId: string;
  email: string;
  role: string;
}

export interface AuthFailure {
  success: false;
  error: string;
  status: number;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * 验证请求中的 JWT Token
 *
 * @param req - Next.js 请求对象
 * @returns 验证结果，成功返回用户信息，失败返回错误信息和状态码
 */
export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  const token = extractToken(req.headers.get("Authorization"));

  if (!token) {
    return {
      success: false,
      error: "未登录",
      status: 401,
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      success: false,
      error: "登录已过期，请重新登录",
      status: 401,
    };
  }

  return {
    success: true,
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}

/**
 * 创建错误响应
 */
export function authError(result: AuthFailure): Response {
  return Response.json({ error: result.error }, { status: result.status });
}
