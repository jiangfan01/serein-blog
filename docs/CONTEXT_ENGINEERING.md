# 上下文工程详解（2026 版）

> 这份文档讲解 AI Agent 系统的上下文管理。重点不是"怎么塞进窗口"，而是"该塞什么、怎么组织、怎么保持一致"。

---

## 一、2026 年的上下文窗口现状

### 1.1 窗口已经很大了

| 模型 | 上下文窗口 |
|------|-----------|
| GPT-4.1 / GPT-5 | 400K+ tokens |
| Claude 4 | 200K tokens |
| Gemini 2.5 / 3 | 1M+ tokens |
| DeepSeek V4 | 128K tokens |
| Kimi | 128K - 200K tokens |

128K token ≈ 10 万字，1M token ≈ 80 万字。普通用户聊一整天也用不完。

### 1.2 核心问题变了

**旧问题**：窗口不够大，历史消息塞不进去，会报错。

**新问题**：窗口够大，但不代表该全塞进去。

2026 年上下文工程要解决的是：

| 问题 | 说明 |
|------|------|
| **成本和延迟** | 1M token 能塞，但每次调用都塞满，成本高、响应慢 |
| **注意力质量** | 模型窗口变大后，不是硬报错，而是"读到了但没用好"。关键信息被淹没在中间 |
| **Agent 状态一致性** | 工具调用序列、任务状态、执行结果、中断恢复——这些比"少了一句话"更危险 |
| **信息时效性** | 过期的计划、失效的工具结果、已完成的任务——不该继续影响决策 |

---

## 二、LLM 的本质：无状态函数

这个基础知识不变，但要讲清楚它对 Agent 的影响。

### 2.1 每次调用都是独立的

```
输入 → LLM → 输出
```

LLM 不会记住上一次调用。所谓的"记忆"，是每次都把相关信息重新发给它。

### 2.2 对 Agent 的影响

普通聊天：重发历史对话就行。

Agent：需要重发的东西多得多：
- 当前任务是什么
- 任务执行到哪一步了
- 之前调用了哪些工具，结果是什么
- 哪些工具调用成功了，哪些失败了
- 用户中途改了什么要求
- 哪些信息已经过期了

**Agent 上下文工程的核心，是保持这些状态的一致性。**

---

## 三、Agent 上下文的组成

### 3.1 分层结构

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: System Prompt                             │
│  身份、能力、规则、可用工具                           │
│  特点：相对固定，每次调用都带                         │
├─────────────────────────────────────────────────────┤
│  Layer 2: Task State（任务状态）                     │
│  当前任务、执行计划、进度、待办                       │
│  特点：任务期间持续更新，任务结束后归档                │
├─────────────────────────────────────────────────────┤
│  Layer 3: Tool Context（工具上下文）                 │
│  最近的工具调用、参数、结果、成功/失败状态             │
│  特点：需要精心管理，不能简单全量保留                  │
├─────────────────────────────────────────────────────┤
│  Layer 4: Retrieved Context（检索上下文）            │
│  RAG 召回的文档、文件内容、外部数据                   │
│  特点：按需检索，用完可以丢弃或摘要                    │
├─────────────────────────────────────────────────────┤
│  Layer 5: Conversation History（对话历史）           │
│  用户和 AI 的对话                                    │
│  特点：滑动窗口 + 摘要                               │
├─────────────────────────────────────────────────────┤
│  Layer 6: Long-term Memory（长期记忆）               │
│  用户画像、历史摘要、结构化事实                       │
│  特点：跨会话持久化，按需检索注入                     │
├─────────────────────────────────────────────────────┤
│  Layer 7: Current Input（当前输入）                  │
│  用户本次的问题或指令                                │
└─────────────────────────────────────────────────────┘
```

### 3.2 每层的管理策略

| 层 | 大小 | 生命周期 | 管理策略 |
|----|------|---------|---------|
| System Prompt | ~2K tokens | 永久 | 固定模板 |
| Task State | ~1K tokens | 任务期间 | 结构化存储，任务结束归档 |
| Tool Context | 可变 | 单次/多次调用 | 成功结果摘要，失败结果保留详情 |
| Retrieved Context | 可变 | 单次调用 | 用完丢弃，必要时摘要 |
| Conversation | ~8K tokens | 会话期间 | 滑动窗口 + 摘要 |
| Long-term Memory | ~1K tokens | 跨会话 | 数据库存储，按需检索 |
| Current Input | ~2K tokens | 单次调用 | 直接使用 |

---

## 四、工具调用上下文（最容易踩坑的地方）

### 4.1 工具调用的完整生命周期

```
用户请求
    ↓
LLM 决定调用工具
    ↓
┌─────────────────────────────────────┐
│  AIMessage (with tool_calls)        │
│  {                                  │
│    content: "让我搜索一下...",       │
│    tool_calls: [{                   │
│      id: "call_abc123",             │
│      name: "rag_search",            │
│      args: { query: "React Hooks" } │
│    }]                               │
│  }                                  │
└─────────────────────────────────────┘
    ↓
执行工具
    ↓
┌─────────────────────────────────────┐
│  ToolMessage                        │
│  {                                  │
│    tool_call_id: "call_abc123",     │
│    name: "rag_search",              │
│    content: "搜索结果: ..."          │
│  }                                  │
└─────────────────────────────────────┘
    ↓
LLM 根据工具结果生成回复
    ↓
┌─────────────────────────────────────┐
│  AIMessage                          │
│  {                                  │
│    content: "根据搜索结果，React..." │
│  }                                  │
└─────────────────────────────────────┘
```

### 4.2 存储 vs 重放的区别

**存储**（写入数据库）：
```typescript
// 我们存储的格式（用于审计、展示、调试）
interface ToolCallRecord {
  tool: string;           // 工具名
  args: object;           // 调用参数
  result: string;         // 返回结果
  status: "success" | "error";  // 执行状态
  latencyMs: number;      // 耗时
  timestamp: Date;        // 时间戳
}
```

**重放**（发给 LLM）：
```typescript
// LangChain 期望的格式
AIMessage {
  content: string;
  tool_calls: [{
    id: string;      // 必须有，用于关联 ToolMessage
    name: string;
    args: object;
  }]
}

ToolMessage {
  tool_call_id: string;  // 必须匹配 AIMessage 的 tool_calls[].id
  name: string;
  content: string;
}
```

**关键问题**：这两个格式不一样！

### 4.3 我们的策略：不重放工具调用

为什么不重放？

1. **格式不兼容**：我们存的是 `{ tool, args, result }`，LangChain 要的是 `{ id, name, args }` + 配对的 ToolMessage
2. **序列容易断**：如果 AIMessage 有 tool_calls 但没有对应的 ToolMessage，LLM 会困惑
3. **结果已经体现在回复中**：工具调用的结果，AI 已经用自然语言总结在回复里了

我们的做法：

```typescript
// history-builder.ts

function convertToLangChainMessages(historyMessages) {
  const messages = [];

  for (const msg of historyMessages) {
    switch (msg.role) {
      case "user":
        messages.push(new HumanMessage(msg.content));
        break;

      case "assistant":
        // 只保留文本内容，不还原 tool_calls
        // 工具调用的结果已经在 content 里了
        messages.push(new AIMessage(msg.content));
        break;

      case "tool":
        // 跳过 tool 消息
        // 因为没有对应的 AIMessage.tool_calls，单独的 ToolMessage 会报错
        break;
    }
  }

  return messages;
}
```

### 4.4 如果需要重放工具调用怎么办？

如果你的场景需要让 LLM 看到完整的工具调用历史（比如调试、复盘），需要：

1. **存储完整序列**：
```typescript
// 存储时保留 tool_call_id
interface StoredMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  // assistant 消息
  toolCalls?: Array<{
    id: string;      // 关键：必须存这个
    name: string;
    arguments: string;  // JSON 字符串
  }>;
  // tool 消息
  toolCallId?: string;
  toolName?: string;
}
```

2. **重放时严格配对**：
```typescript
function replayWithToolCalls(messages) {
  const result = [];
  
  for (const msg of messages) {
    if (msg.role === "assistant" && msg.toolCalls?.length) {
      // 有 tool_calls 的 AIMessage
      result.push(new AIMessage({
        content: msg.content || "",
        tool_calls: msg.toolCalls.map(tc => ({
          id: tc.id,
          name: tc.name,
          args: JSON.parse(tc.arguments),
        })),
      }));
    } else if (msg.role === "tool" && msg.toolCallId) {
      // 配对的 ToolMessage
      result.push(new ToolMessage({
        content: msg.content,
        tool_call_id: msg.toolCallId,
        name: msg.toolName,
      }));
    } else if (msg.role === "user") {
      result.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      result.push(new AIMessage(msg.content));
    }
  }
  
  return result;
}
```

3. **处理中断情况**：
```typescript
// 如果最后一条 AIMessage 有 tool_calls 但没有对应的 ToolMessage
// 需要补充占位消息
function patchIncompleteToolCalls(messages) {
  const lastMsg = messages[messages.length - 1];
  
  if (lastMsg instanceof AIMessage && lastMsg.tool_calls?.length) {
    const existingToolMsgIds = new Set(
      messages
        .filter(m => m instanceof ToolMessage)
        .map(m => m.tool_call_id)
    );
    
    for (const tc of lastMsg.tool_calls) {
      if (!existingToolMsgIds.has(tc.id)) {
        messages.push(new ToolMessage({
          content: "[工具调用被中断]",
          tool_call_id: tc.id,
          name: tc.name,
        }));
      }
    }
  }
  
  return messages;
}
```

---

## 五、滑动窗口：对话历史管理

### 5.1 基本原理

只保留最近 N 轮对话，旧的被"挤出去"：

```
对话历史：[1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
                              ↑─────────────────↑
                              滑动窗口（最近 5 轮）
```

### 5.2 按"轮"而不是按"条"

一轮 = 用户问 + AI 答（可能包含多次工具调用）

```
第 1 轮：
  [user]      查一下 React Hooks
  [assistant] 根据搜索结果...（这条消息的生成过程中可能调用了工具）

第 2 轮：
  [user]      useEffect 怎么用？
  [assistant] useEffect 的用法是...
```

按轮截断，保证上下文完整。

### 5.3 双重限制

```typescript
// 1. 按轮数限制
messages = truncateByRounds(messages, maxRounds: 10);

// 2. 按 token 限制
messages = truncateByTokens(messages, maxTokens: 8000);
```

哪个先触发用哪个。

### 5.4 动态预算

根据模型的上下文窗口动态调整：

```typescript
function calculateTokenBudget(modelContextLength: number) {
  // 固定开销
  const fixed = {
    systemPrompt: 2000,
    taskState: 1000,
    currentInput: 2000,
    reservedForOutput: 4000,
  };
  
  const totalFixed = Object.values(fixed).reduce((a, b) => a + b, 0);
  const remaining = modelContextLength - totalFixed;
  
  // 历史对话预算 = 剩余空间的 60%
  // 留 40% 给工具结果、RAG 召回等动态内容
  const conversationHistory = Math.min(
    Math.floor(remaining * 0.6),
    32000  // 上限，太长影响注意力质量
  );
  
  return { ...fixed, conversationHistory };
}
```

---

## 六、会话摘要：压缩早期对话

### 6.1 触发时机

不是机械地"每 10 轮生成一次"，而是：

| 触发条件 | 说明 |
|---------|------|
| Token 压力 | 历史对话接近预算上限时 |
| 任务边界 | 一个任务完成，开始新任务时 |
| 重要事件 | 用户明确表示"记住这个"、达成重要结论时 |
| 时间间隔 | 用户离开一段时间后回来 |

### 6.2 摘要内容

```typescript
interface SessionSummary {
  // 核心信息
  mainTopics: string[];        // 讨论的主要话题
  conclusions: string[];       // 达成的结论
  userPreferences: string[];   // 用户表达的偏好
  
  // 任务相关
  completedTasks: string[];    // 已完成的任务
  pendingItems: string[];      // 待办事项
  
  // 技术细节
  codeSnippets?: string[];     // 重要的代码片段
  configurations?: string[];   // 确定的配置
  
  // 元数据
  roundsCovered: number;       // 覆盖了多少轮对话
  createdAt: Date;
  
  // 失效标记
  invalidatedAt?: Date;        // 如果后续对话推翻了某些结论
}
```

### 6.3 摘要生成 Prompt

```typescript
const SUMMARY_PROMPT = `
请将以下对话压缩为结构化摘要。

要求：
1. 保留用户的核心问题和最终结论
2. 保留重要的技术决定（版本、配置、架构选择）
3. 标记已完成和待办的事项
4. 删除寒暄、重复、中间的试错过程
5. 如果有代码，只保留最终版本

对话历史：
${messages}

输出 JSON 格式：
{
  "mainTopics": ["..."],
  "conclusions": ["..."],
  "completedTasks": ["..."],
  "pendingItems": ["..."]
}
`;
```

---

## 七、长期记忆：跨会话的用户画像

### 7.1 用户画像结构

```typescript
interface UserProfile {
  // 技术背景
  techStack: string[];           // ["React", "TypeScript", "Next.js"]
  skillLevel: "junior" | "mid" | "senior";
  experienceYears?: number;
  
  // 学习目标
  learningGoals: string[];       // ["学习 Next.js", "准备面试"]
  
  // 求职意向（如果是求职助手）
  careerGoals?: {
    targetPosition: string;
    targetCity: string;
    expectedSalary: string;
    timeline: string;
  };
  
  // 偏好
  communicationStyle: string;    // "喜欢详细解释" / "喜欢简洁回答"
  codeStyle?: string;            // "偏好函数式" / "偏好 OOP"
  
  // 元数据
  lastUpdated: Date;
  confidence: number;            // 0-1，画像的可信度
}
```

### 7.2 画像更新策略

不是每次对话都更新，而是：

```typescript
async function shouldUpdateProfile(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  
  // 1. 从未生成过
  if (!profile) return true;
  
  // 2. 超过 7 天没更新
  const daysSinceUpdate = daysBetween(profile.lastUpdated, new Date());
  if (daysSinceUpdate > 7) return true;
  
  // 3. 累积了足够多的新对话
  const newSessionCount = await countSessionsSince(userId, profile.lastUpdated);
  if (newSessionCount >= 5) return true;
  
  return false;
}
```

### 7.3 画像注入方式

```typescript
function buildSystemPrompt({ userProfile }) {
  let prompt = `<system>你是前端助手...</system>`;
  
  if (userProfile && userProfile.confidence > 0.6) {
    prompt += `
<user_context>
用户背景：
- 技术栈：${userProfile.techStack.join(", ")}
- 水平：${userProfile.skillLevel}
- 目标：${userProfile.learningGoals.join(", ")}

请根据用户背景调整回答的深度和风格。
</user_context>`;
  }
  
  return prompt;
}
```

---

## 八、信息失效管理

### 8.1 什么信息会过期？

| 类型 | 失效条件 | 处理方式 |
|------|---------|---------|
| 任务计划 | 任务完成或取消 | 标记为已完成，移出活跃上下文 |
| 工具结果 | 数据源更新、时间过长 | 重新调用或标记为"可能过期" |
| 用户偏好 | 用户明确改变 | 更新画像，标记旧偏好失效 |
| 代码片段 | 用户修改了代码 | 用新版本替换 |
| 外部数据 | 超过 TTL | 重新检索或标记为"截至 X 时间" |

### 8.2 失效标记

```typescript
interface ContextItem {
  content: string;
  type: "fact" | "plan" | "tool_result" | "preference";
  createdAt: Date;
  
  // 失效信息
  validUntil?: Date;           // 明确的过期时间
  invalidatedBy?: string;      // 被哪条消息/事件推翻
  confidence?: number;         // 可信度，随时间衰减
}
```

### 8.3 注入时过滤

```typescript
function filterValidContext(items: ContextItem[]): ContextItem[] {
  const now = new Date();
  
  return items.filter(item => {
    // 已被明确推翻
    if (item.invalidatedBy) return false;
    
    // 已过期
    if (item.validUntil && item.validUntil < now) return false;
    
    // 可信度太低
    if (item.confidence && item.confidence < 0.3) return false;
    
    return true;
  });
}
```

---

## 九、完整的上下文构建流程

```typescript
async function buildAgentContext(options: BuildContextOptions) {
  const {
    user,
    session,
    currentInput,
    currentTask,
    modelContextLength,
  } = options;

  // 1. 计算 token 预算
  const budget = calculateTokenBudget(modelContextLength);

  // 2. 构建系统提示词
  const systemPrompt = buildSystemPrompt({
    userProfile: await loadUserProfile(user.id),
  });

  // 3. 构建任务状态（如果有活跃任务）
  const taskState = currentTask
    ? buildTaskState(currentTask)
    : "";

  // 4. 加载会话摘要（如果有）
  const summary = await loadSessionSummary(session.id);

  // 5. 加载滑动窗口内的对话历史
  const history = await loadHistory(session.id, {
    maxRounds: 10,
    maxTokens: budget.conversationHistory,
    excludeMessageId: options.excludeMessageId,
  });

  // 6. 转换为 LangChain 消息格式
  const historyMessages = convertToLangChainMessages(history);

  // 7. 组装最终消息
  const messages = [
    new SystemMessage(systemPrompt),
    ...(taskState ? [new SystemMessage(taskState)] : []),
    ...(summary ? [new HumanMessage(`[历史摘要] ${summary}`)] : []),
    ...historyMessages,
    new HumanMessage(currentInput),
  ];

  // 8. 返回构建结果
  return {
    messages,
    metadata: {
      tokenEstimates: estimateTokens(messages),
      historyCount: history.length,
      hasSummary: !!summary,
      hasTaskState: !!taskState,
    },
  };
}
```

---

## 十、我们项目的实现状态

### 10.1 已实现

| 功能 | 文件 | 状态 |
|------|------|------|
| 分层类型定义 | `context/types.ts` | ✅ |
| 滑动窗口加载 | `context/history-builder.ts` | ✅ |
| Token 估算 | `context/history-builder.ts` | ✅ |
| 动态 Token 预算 | `context/message-builder.ts` | ✅ |
| 系统提示词构建 | `context/system-prompt.ts` | ✅ |
| 消息组装 | `context/message-builder.ts` | ✅ |
| 排除当前消息 | `context/history-builder.ts` | ✅ |
| 模型上下文长度联动 | `router/model-router.ts` | ✅ |

### 10.2 待实现

| 功能 | 优先级 | 说明 |
|------|--------|------|
| SessionSummary 表 | P1 | 存储会话摘要 |
| 摘要生成服务 | P1 | 用小模型生成摘要 |
| UserProfile 表 | P2 | 存储用户画像 |
| 画像分析服务 | P2 | 定期分析用户特征 |
| 任务状态管理 | P2 | 支持多步骤任务 |
| 信息失效标记 | P3 | 标记过期信息 |

### 10.3 数据库 Schema（计划）

```prisma
// 会话摘要
model SessionSummary {
  id            String   @id @default(cuid())
  sessionId     String   @unique
  session       ChatSession @relation(...)
  
  content       String   // 摘要文本
  structured    Json?    // 结构化摘要 { topics, conclusions, ... }
  roundsCovered Int      // 覆盖的对话轮数
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// 用户画像
model UserProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(...)
  
  techStack     String[]
  skillLevel    String?
  learningGoals String[]
  careerGoals   Json?
  preferences   Json?
  
  confidence    Float    @default(0.5)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 十一、总结

### 11.1 上下文工程的核心问题（2026 版）

1. **不是能不能塞，是该不该塞** - 窗口够大，但成本、延迟、注意力质量都是问题
2. **Agent 状态一致性** - 工具调用、任务状态、执行结果的管理比对话历史更复杂
3. **信息时效性** - 过期信息不该继续影响决策
4. **分层管理** - 不同类型的信息，不同的生命周期和管理策略

### 11.2 关键设计决策

| 决策 | 我们的选择 | 原因 |
|------|-----------|------|
| 工具调用历史 | 不重放，只保留文本 | 格式不兼容，结果已在回复中 |
| 滑动窗口 | 按轮 + 按 Token 双重限制 | 保证上下文完整，控制成本 |
| Token 预算 | 根据模型动态计算 | 不同模型窗口不同 |
| 摘要触发 | Token 压力 + 任务边界 | 比固定轮数更合理 |
| 用户画像 | 跨会话持久化，按需注入 | 避免每次都分析 |
