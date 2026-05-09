# 开发规则

## 代码风格

### TypeScript
- 使用严格模式
- 优先使用 `interface` 而非 `type`（除非需要联合类型）
- 导出类型时使用 `export type`
- 避免 `any`，必要时用 `unknown` + 类型守卫

### 命名规范
- 文件名：kebab-case（如 `user-service.ts`）
- 组件：PascalCase（如 `ChatInput.tsx`）
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE
- 类型/接口：PascalCase

### 目录规范
- 每个模块有 `index.ts` 统一导出
- 类型定义放在 `types.ts` 或 `types/` 目录
- 测试文件放在 `__tests__/` 目录

## 分层原则

### API Route（薄层）
```typescript
// ✅ 正确：只做请求处理
export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth.success) return authError(auth);
  
  const { question } = await req.json();
  const result = await chatService.sendMessage(question);
  return Response.json(result);
}

// ❌ 错误：包含业务逻辑
export async function POST(req: NextRequest) {
  // 不要在这里写数据库操作、复杂逻辑
  const user = await prisma.user.findUnique(...);
  if (user.dailyLimit > ...) { ... }
}
```

### Service 层
- 包含业务逻辑
- 可以调用多个数据操作
- 可以调用其他 Service
- 不依赖 HTTP 请求/响应对象

### Agent 层
- 只关注 AI 相关逻辑
- 不直接操作数据库（通过 Service）
- 工具定义独立于编排逻辑

## 前端规范

### Hooks
- 业务逻辑封装在 hooks 中
- 使用 TanStack Query 做数据请求
- 命名：`use-xxx.ts`

### 组件
- 优先使用函数组件
- 使用 shadcn/ui 基础组件
- 样式使用 TailwindCSS
- 避免内联样式

### 状态管理
- 全局状态用 Zustand
- 服务端状态用 TanStack Query
- 组件内状态用 useState

## Git 规范

### Commit Message
```
<type>: <description>

feat: 新功能
fix: 修复 bug
refactor: 重构
style: 样式调整
docs: 文档更新
chore: 构建/工具变更
```

### 分支
- `main` - 生产分支
- `feat/xxx` - 功能分支
- `fix/xxx` - 修复分支

## 数据库规范

### Prisma
- Schema 变更后运行 `pnpm prisma generate`
- 迁移使用 `pnpm prisma migrate dev`
- 生产环境使用 `pnpm prisma migrate deploy`

### 命名
- 表名：snake_case（通过 `@@map` 映射）
- 字段名：camelCase（Prisma 默认）

## 安全规范

### 认证
- 所有 API 使用 `verifyAuth` 中间件
- JWT 存储在 httpOnly cookie
- 敏感操作需要二次验证

### 数据
- 用户只能访问自己的数据
- 使用参数化查询（Prisma 默认）
- 敏感字段不返回给前端

## 错误处理

### API 错误响应
```typescript
// 统一格式
return Response.json({ error: "错误信息" }, { status: 400 });

// 状态码
// 400 - 参数错误
// 401 - 未认证
// 403 - 无权限
// 404 - 资源不存在
// 429 - 请求过多
// 500 - 服务器错误
```

### 前端错误处理
- 使用 toast 提示用户
- 网络错误自动重试（TanStack Query）
- 关键操作有 loading 状态

## 性能规范

### 数据库
- 添加必要的索引
- 避免 N+1 查询
- 大列表使用分页

### 前端
- 使用 React.memo 避免不必要渲染
- 图片使用 next/image
- 代码分割（动态导入）

## 测试规范

### 单元测试
- Service 层必须有测试
- 工具函数必须有测试
- 使用 Vitest

### E2E 测试
- 关键流程有 E2E 测试
- 使用 Playwright
