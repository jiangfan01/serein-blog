# Agent 模块开发指南

## 模块结构

```
lib/agent/
├── context/              # 上下文工程
│   ├── types.ts          # 类型定义
│   ├── system-prompt.ts  # XML 系统提示词
│   ├── history-builder.ts # 历史消息构建
│   ├── message-builder.ts # 消息数组组装
│   └── index.ts
│
├── router/               # 路由模块
│   ├── types.ts
│   ├── intent-classifier.ts  # 意图分类
│   ├── model-router.ts       # 模型路由
│   ├── call-logger.ts        # 调用日志
│   └── index.ts
│
├── tools/                # 工具定义
│   ├── rag-search.ts     # RAG 检索
│   ├── web-search.ts     # 联网搜索
│   └── index.ts
│
├── agent.ts              # LangGraph 编排入口
├── models.ts             # 模型配置
└── types.ts              # 公共类型
```

## 执行流程

```
runAgent(question, sessionId, options)
    │
    ├─→ 1. 意图分类 (IntentClassifier.classify)
    │      输入: question
    │      输出: { intent, confidence }
    │
    ├─→ 2. 模型路由 (ModelRouter.route)
    │      输入: { question, intent, sessionId }
    │      输出: RouteResult { modelName, baseUrl, ... }
    │
    ├─→ 3. 上下文构建 (buildContext / buildSimpleContext)
    │      输入: question, user, session
    │      输出: { messages[], systemPrompt, metadata }
    │
    ├─→ 4. LangGraph 执行
    │      图: START → agent → should_continue? → tools → agent → END
    │
    └─→ 5. SSE 流式输出
           事件: model_select, thinking, tool_start, tool_end, text_delta, done
```

## 上下文工程

### XML 结构

```xml
<system>
  <identity>角色定义</identity>
  <capabilities>能力列表</capabilities>
  <tools>
    <tool name="rag_search">工具说明</tool>
  </tools>
  <rules>
    <rule priority="high">高优先级规则</rule>
  </rules>
  <output_format>输出格式要求</output_format>
</system>

<runtime_context>
  <current_time>2026-05-09 14:30</current_time>
</runtime_context>

<user_preference>
  <response_style name="technical">技术严谨风格提示词</response_style>
</user_preference>

<user_query>
用户的问题
</user_query>
```

### 构建函数

```typescript
// 完整构建（带历史消息）
const context = await buildContext({
  user: { userId, responseStyle },
  session: { sessionId, isFirstTurn, historyCount },
  currentInput: question,
  maxHistoryMessages: 20,
});

// 简化构建（单轮对话）
const context = buildSimpleContext(question, { responseStyle });
```

## 添加新工具

1. 在 `tools/` 下创建工具文件：

```typescript
// tools/my-tool.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const myTool = new DynamicStructuredTool({
  name: "my_tool",
  description: "工具描述，LLM 会根据这个决定是否调用",
  schema: z.object({
    param1: z.string().describe("参数说明"),
  }),
  func: async ({ param1 }) => {
    // 工具逻辑
    return "结果";
  },
});
```

2. 在 `tools/index.ts` 导出：

```typescript
export { myTool } from "./my-tool";
export const allTools = [ragSearchTool, webSearchTool, myTool];
```

3. 在 `system-prompt.ts` 添加工具说明：

```xml
<tool name="my_tool">
工具用途说明，告诉 LLM 什么时候应该使用这个工具。
</tool>
```

## 意图分类

当前使用规则匹配（简单但粗糙）：

```typescript
// router/intent-classifier.ts
if (question.includes("搜索")) return { intent: "web_search" };
if (question.includes("博客")) return { intent: "rag_search" };
return { intent: "knowledge_qa" };
```

**改进方向**：
1. 用小模型做分类（DeepSeek Flash）
2. Embedding 相似度匹配
3. 让主模型自己决定（在 system prompt 里说明规则）

## 模型路由

从数据库读取路由规则：

```typescript
// 数据库表: ModelRouteRule
// intentType → modelId 的映射

const rules = await prisma.modelRouteRule.findMany({
  where: { enabled: true },
  orderBy: { priority: "asc" },
});
```

## SSE 事件类型

```typescript
type SSEEvent =
  | { type: "execution_start"; executionId: string }
  | { type: "model_select"; model: string; intent: string }
  | { type: "thinking" }
  | { type: "tool_start"; tool: string; args: Record<string, unknown> }
  | { type: "tool_end"; tool: string; result: string }
  | { type: "text_delta"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };
```

## 断线重连

1. 每次 text_delta 时更新 `ChatExecution.progress`
2. 客户端断开时标记为 `interrupted`
3. 前端重连时检查 `execution` 状态，恢复已有内容

## 调试技巧

1. 查看 LangGraph 执行日志：
```typescript
console.log("[Agent] 上下文构建完成", {
  isFirstTurn: context.metadata.isFirstTurn,
  historyCount: context.metadata.historyCount,
  estimatedTokens: context.metadata.totalTokensEstimate,
});
```

2. 查看模型调用日志：
```sql
SELECT * FROM model_call_logs ORDER BY created_at DESC LIMIT 10;
```

3. 查看执行记录：
```sql
SELECT * FROM chat_executions WHERE session_id = 'xxx';
```
