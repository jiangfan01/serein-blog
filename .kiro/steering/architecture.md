# 项目架构文档

> Frontend Career Agent - 面向前端开发者的 AI 求职与成长助手

## 项目定位

这是一个**垂直于前端领域**的 AI Agent 应用，不是通用聊天机器人。核心能力：
- 前端知识问答（基于 RAG）
- 简历分析（规划中）
- 岗位匹配（规划中）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 15 (App Router) + React 19 |
| 样式 | TailwindCSS + shadcn/ui |
| 状态管理 | Zustand + TanStack Query |
| 后端 | Next.js API Routes (Serverless) |
| 数据库 | Supabase (PostgreSQL + pgvector) |
| ORM | Prisma |
| AI 框架 | LangChain + LangGraph |
| 部署 | Vercel |

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API 路由（薄层，只做请求处理）
│   │   ├── auth/           # 认证相关
│   │   ├── chat/           # 聊天核心
│   │   ├── sessions/       # 会话管理
│   │   └── user/           # 用户偏好
│   ├── chat/               # 聊天页面
│   └── notes/              # 博客笔记页面
│
├── lib/                    # 核心业务逻辑
│   ├── agent/              # AI Agent 模块
│   │   ├── context/        # 上下文工程（XML 提示词构建）
│   │   ├── router/         # 意图分类 + 模型路由
│   │   ├── tools/          # 工具定义（RAG、Web Search）
│   │   └── agent.ts        # LangGraph 编排入口
│   │
│   ├── services/           # 业务服务层
│   │   ├── user.service.ts
│   │   ├── session.service.ts
│   │   ├── message.service.ts
│   │   └── chat.service.ts
│   │
│   ├── auth/               # 认证模块
│   ├── config/             # 配置集中管理
│   └── rag/                # RAG 相关
│
├── hooks/                  # React Hooks
│   ├── use-chat.ts         # 聊天核心 hook
│   ├── use-sessions.ts     # 会话管理
│   └── use-auth.ts         # 认证状态
│
├── stores/                 # Zustand 状态
│   └── session-store.ts
│
├── components/             # UI 组件
│   ├── chat/               # 聊天相关组件
│   └── ui/                 # shadcn 基础组件
│
└── types/                  # 全局类型定义
    ├── api.ts
    ├── chat.ts
    └── user.ts
```

## 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        API Route                            │
│  职责：请求验证、参数提取、调用 Service、构建响应              │
│  原则：保持薄层，不包含业务逻辑                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  职责：业务逻辑、数据组装、跨模块协调                         │
│  文件：lib/services/*.service.ts                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Agent Layer                            │
│  职责：AI 编排、上下文构建、工具调用                          │
│  文件：lib/agent/                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  职责：数据持久化                                            │
│  技术：Prisma + Supabase                                    │
└─────────────────────────────────────────────────────────────┘
```

## Agent 执行流程

```
用户输入
    │
    ▼
┌─────────────┐
│ 意图分类     │ → 判断用户意图（knowledge_qa / web_search / simple_chat）
└─────────────┘
    │
    ▼
┌─────────────┐
│ 模型路由     │ → 根据意图选择模型（从数据库读取路由规则）
└─────────────┘
    │
    ▼
┌─────────────┐
│ 上下文构建   │ → 构建 XML 结构化提示词 + 消息数组
└─────────────┘
    │
    ▼
┌─────────────┐
│ LangGraph   │ → agent → tools → agent → ... → END
└─────────────┘
    │
    ▼
SSE 流式输出
```

## 上下文工程

使用 XML 结构化提示词，位于 `lib/agent/context/`：

```xml
<system>
  <identity>身份定义</identity>
  <capabilities>能力说明</capabilities>
  <tools>可用工具</tools>
  <rules>行为规则</rules>
</system>

<runtime_context>
  <current_time>当前时间</current_time>
</runtime_context>

<user_preference>
  <response_style>用户偏好的回答风格</response_style>
</user_preference>

<user_query>
用户的问题
</user_query>
```

## 数据模型

核心表：
- `User` - 用户（含权限、配额、偏好）
- `ChatSession` - 会话
- `ChatMessage` - 消息（user/assistant/tool）
- `ChatExecution` - 执行记录（支持断线重连）
- `ModelConfig` - 模型配置
- `ModelRouteRule` - 路由规则
- `ModelCallLog` - 调用日志

## 关键文件说明

| 文件 | 职责 |
|------|------|
| `lib/agent/agent.ts` | LangGraph 编排入口，核心执行逻辑 |
| `lib/agent/context/system-prompt.ts` | XML 系统提示词模板 |
| `lib/agent/context/message-builder.ts` | 消息数组构建 |
| `lib/agent/router/intent-classifier.ts` | 意图分类（目前是规则匹配） |
| `lib/agent/router/model-router.ts` | 模型路由（从数据库读取） |
| `lib/agent/tools/rag-search.ts` | RAG 检索工具 |
| `lib/agent/tools/web-search.ts` | 联网搜索工具 |
| `lib/services/chat.service.ts` | 聊天业务逻辑 |
| `lib/auth/middleware.ts` | JWT 认证中间件 |
