/**
 * 会话摘要压缩
 *
 * 触发：每轮回答结束后异步调用。估算历史 token，超过预算 80% 就压缩。
 * 策略：保留最近 PRESERVE_RECENT_ROUNDS 轮原文，更早的（含已有摘要）压成一份滚动摘要，
 *       写回 ChatSession.summaryContent + summarizedUpToMessageId（截断点）。
 *
 * 设计决策（已和导师确认）：
 * 1. 摘要存哪：ChatSession 的 summaryContent + summarizedUpToMessageId
 * 2. 何时压：异步（回答完之后），不阻塞当前响应
 * 3. 滚动累积：新摘要 = 旧摘要 + 新挤出的旧对话，融合成一份
 * 4. 触发分母：80% × conversationHistory 预算（按模型窗口动态算）
 *
 * 注：本项目工具结果不重放进上下文（history-builder 跳过 tool 消息），
 *     工具关键信息已体现在 assistant 文本回复里，摘要旧对话时自然一并压缩，
 *     无需单独处理工具结果（与 60 工具的企业级场景的本质区别）。
 */

import { ChatOpenAI } from "@langchain/openai";
import { prisma } from "@/lib/prisma";
import { estimateTokens, loadSessionSummary } from "./history-builder";
import { calculateTokenBudget } from "./message-builder";

// 触发阈值：历史 token 超过预算的 80%
const TRIGGER_RATIO = 0.8;
// 保留最近 N 轮原文，只压更早的
const PRESERVE_RECENT_ROUNDS = 3;
// 🔑 摘要本身的大小上限（防止滚动摘要无限膨胀 —— 长会话系统最大的坑）
// 摘要是"定长"的：超出时 LLM 必须丢次要细节，保留最重要的。
// 对博客这种规模，单层摘要 + 这个上限就够；规模再大才需要分层摘要(L1/L2/L3)
// 或拆成 摘要 + 关键事实 + 用户偏好 分别存（扩展点见文末注释）。
const MAX_SUMMARY_TOKENS = 800;
// 兜底硬上限（按中文≈1.5token/字 折算，约 530 字，留余量取 700 字）
const MAX_SUMMARY_CHARS = 700;

// 用便宜模型做摘要（不需要强模型）
const summaryModel = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: "https://api.deepseek.com/v1" },
  temperature: 0.2,
});

const SUMMARY_PROMPT = `你是对话摘要器。把历史对话压缩成简洁摘要，要求：
1. 保留用户的核心问题、达成的结论、确定的技术决定（版本/配置/方案选择）
2. 保留用户偏好、已完成事项和待办事项
3. 删除寒暄、重复、中间的试错过程
4. 如果提供了"已有历史摘要"，把它和新对话融合成一份更新后的摘要，不要丢失早期的重要信息
5. 【硬性长度上限】摘要必须控制在 ${MAX_SUMMARY_TOKENS} token（约 ${MAX_SUMMARY_CHARS} 字）以内。
   一旦超出，必须丢弃最次要的细节、合并相似条目，优先保留：结论 > 技术决定 > 用户偏好 > 待办。
   摘要是"定长"的，宁可抽象也不能无限增长。
只输出摘要正文，不要任何解释或前缀。`;

export interface CompressResult {
  compressed: boolean;
  reason?: string;
  /** 压缩后摘要覆盖到的消息 ID */
  cutMessageId?: string;
}

/**
 * 若历史超过阈值，则压缩旧对话为摘要
 *
 * @param sessionId 会话 ID
 * @param modelContextLength 模型上下文长度（用于动态算预算；不传则用默认预算）
 */
export async function compressSessionIfNeeded(opts: {
  sessionId: string;
  modelContextLength?: number;
}): Promise<CompressResult> {
  const { sessionId, modelContextLength } = opts;

  try {
    // 1. 当前滚动摘要 + 截断点
    const mem = await loadSessionSummary(sessionId);

    // 2. 取截断点之后的消息（正序），这些是还没被摘要覆盖的
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        ...(mem.cutAtCreatedAt && { createdAt: { gt: mem.cutAtCreatedAt } }),
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true },
    });

    // 3. 感知 token：已有摘要 + 未摘要消息（这一步回答了"怎么感知上下文 token"）
    const historyTokens =
      (mem.summaryContent ? estimateTokens(mem.summaryContent) : 0) +
      messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);

    const budget = calculateTokenBudget(modelContextLength).conversationHistory;
    const threshold = Math.floor(budget * TRIGGER_RATIO);

    if (historyTokens < threshold) {
      return {
        compressed: false,
        reason: `未触发：历史 ${historyTokens} tokens < 阈值 ${threshold}`,
      };
    }

    // 4. 找最近 N 轮的起点（每条 user 消息是一轮开始），更早的拿去摘要
    const userIndices: number[] = [];
    messages.forEach((m, i) => {
      if (m.role === "user") userIndices.push(i);
    });

    if (userIndices.length <= PRESERVE_RECENT_ROUNDS) {
      return { compressed: false, reason: "轮数不足，无需压缩" };
    }

    const keepFromIndex = userIndices[userIndices.length - PRESERVE_RECENT_ROUNDS];
    const toSummarize = messages.slice(0, keepFromIndex);

    if (toSummarize.length === 0) {
      return { compressed: false, reason: "没有可压缩的旧消息" };
    }

    // 5. 生成滚动摘要（旧摘要 + 新挤出的旧对话 融合）
    const convoText = toSummarize
      .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content}`)
      .join("\n");

    const userContent =
      (mem.summaryContent ? `已有历史摘要：\n${mem.summaryContent}\n\n` : "") +
      `需要并入摘要的对话：\n${convoText}`;

    const res = await summaryModel.invoke([
      { role: "system", content: SUMMARY_PROMPT },
      { role: "user", content: userContent },
    ]);

    let newSummary =
      typeof res.content === "string" ? res.content : JSON.stringify(res.content);
    newSummary = newSummary.trim();

    // 🔑 硬兜底：即使 LLM 不守长度，代码层也强制封顶，保证摘要定长不膨胀
    if (newSummary.length > MAX_SUMMARY_CHARS) {
      console.warn(
        `[summarizer] 摘要超长(${newSummary.length}字)，强制截断到 ${MAX_SUMMARY_CHARS}。` +
          `若频繁触发，说明单层摘要已不够，该上分层摘要(L1/L2)了。`
      );
      newSummary = newSummary.slice(0, MAX_SUMMARY_CHARS);
    }

    // 6. 更新截断点 = 被摘要的最后一条消息
    const cutMessageId = toSummarize[toSummarize.length - 1].id;

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        summaryContent: newSummary,
        summarizedUpToMessageId: cutMessageId,
      },
    });

    console.log("[summarizer] 压缩完成", {
      sessionId,
      historyTokens,
      threshold,
      summarizedMessages: toSummarize.length,
      cutMessageId,
    });

    return { compressed: true, cutMessageId };
  } catch (err) {
    // 压缩失败不影响主流程（异步、降级）
    console.error("[summarizer] 压缩失败:", err);
    return { compressed: false, reason: "error" };
  }
}

/**
 * ============================================================
 * 扩展点：当单层定长摘要不够用时（频繁触发硬截断告警），按需升级
 * ============================================================
 *
 * 当前方案（够博客用）：单层滚动摘要 + 固定大小上限（MAX_SUMMARY_TOKENS）。
 * 摘要定长，永不膨胀，代价是早期次要细节会逐渐被抽象掉（可接受，类似人脑记忆）。
 *
 * 规模变大后的两条升级路线（先不做，留接口）：
 *
 * 1) 分层摘要 L1/L2/L3
 *    - L1：最近一段的细摘要
 *    - 当 L1 超限 → 把 L1 压成更抽象的 L2，L1 清空重攒
 *    - 越老的记忆越抽象，整体仍定长
 *    实现：ChatSession 再加 summaryL2 字段，或单开 SessionSummary 表存多层
 *
 * 2) 拆成结构化记忆（各自定长，互不挤占）
 *    - Conversation Summary：对话脉络
 *    - Key Facts：结构化事实（"用 Next.js 16""数据库用 Postgres"）
 *    - User Preferences：用户偏好（回答风格、技术栈）
 *    实现：对应你文档里的 UserProfile / SessionSummary 表
 *
 * 触发升级的信号：上面的"摘要超长强制截断"告警频繁出现。
 */
