/**
 * XML 结构化系统提示词
 *
 * 简化版 XML 结构，适合垂直领域：
 * <system> - 身份、能力、规则
 * <context> - 运行时信息、用户偏好
 * <memory> - 用户画像（可选）
 * <query> - 用户问题
 */

import type { SystemPromptVariables, UserProfile } from "./types";

/**
 * 构建系统提示词
 *
 * 简化的 XML 结构：
 * - <system>: 身份 + 能力 + 工具 + 规则
 * - 不再使用深层嵌套
 * - 用 Markdown 列表代替复杂 XML
 */
export function buildSystemPrompt(variables: SystemPromptVariables): string {
  const { currentTime, responseStyle, userProfile } = variables;

  let prompt = `<system>
你是 Frontend Career Agent，专注于前端开发领域的 AI 助手。

## 核心能力
- 回答前端技术问题（JavaScript、TypeScript、React、Vue、Next.js、工程化等）
- 检索知识库中的技术文章和笔记
- 联网搜索最新技术资讯和文档
- 分析和优化前端简历（规划中）
- 匹配前端岗位需求（规划中）

## 可用工具
- rag_search: 在前端知识库中进行语义检索，优先使用
- web_search: 联网搜索公开网页信息，用于最新资讯

## 行为规则
1. 回答必须基于可靠依据：有检索结果则引用，无依据则明确说明
2. 工具使用决策：
   - 用户要求搜索/联网 → web_search
   - 询问知识库/博客/笔记 → rag_search
   - 简单闲聊或通用概念 → 直接回答
3. 始终使用中文回答，技术术语可保留英文
4. 代码示例使用 markdown 代码块，标注语言
5. 结构清晰，善用列表，直接、少废话

## 输出格式
- 技术问题：先给结论，再解释原理，最后给示例
- 代码问题：先分析问题，再给解决方案
- 不确定时：明确说明不确定的部分
</system>`;

  // 添加运行时上下文
  prompt += `

<context>
时间: ${currentTime}`;

  // 添加用户偏好
  if (responseStyle && responseStyle.key !== "default") {
    prompt += `
回答风格: ${responseStyle.label}
风格说明: ${responseStyle.prompt}`;
  }

  prompt += `
</context>`;

  // 添加用户画像（如果有）
  if (userProfile) {
    prompt += buildUserProfileSection(userProfile);
  }

  return prompt;
}

/**
 * 构建用户画像部分
 */
function buildUserProfileSection(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.techStack?.length) {
    parts.push(`技术栈: ${profile.techStack.join(", ")}`);
  }

  if (profile.skillLevel) {
    const levelMap = {
      junior: "初级",
      mid: "中级",
      senior: "高级",
    };
    parts.push(`技能水平: ${levelMap[profile.skillLevel]}`);
  }

  if (profile.learningGoals?.length) {
    parts.push(`学习目标: ${profile.learningGoals.join(", ")}`);
  }

  if (profile.careerGoals) {
    const { targetPosition, targetCity, expectedSalary } = profile.careerGoals;
    if (targetPosition || targetCity) {
      const careerParts = [];
      if (targetPosition) careerParts.push(targetPosition);
      if (targetCity) careerParts.push(targetCity);
      if (expectedSalary) careerParts.push(expectedSalary);
      parts.push(`求职目标: ${careerParts.join(" · ")}`);
    }
  }

  if (parts.length === 0) return "";

  return `

<memory>
## 用户画像
${parts.map((p) => `- ${p}`).join("\n")}
</memory>`;
}

/**
 * 构建用户消息包装
 *
 * 将用户输入包装在 <query> 标签中
 */
export function wrapUserQuery(query: string, _isFirstTurn?: boolean): string {
  // 简化：不再区分首轮/后续轮的包装方式
  // _isFirstTurn 保留参数以便未来扩展
  return `<query>
${query}
</query>`;
}

/**
 * 构建后续轮的偏好提醒（简化版）
 */
export function buildPreferenceReminder(hasStylePreference: boolean): string {
  if (!hasStylePreference) {
    return "";
  }

  // 简化提醒，不用 XML
  return `[请继续使用之前设置的回答风格]

`;
}

/**
 * 构建会话摘要注入
 *
 * 当有历史摘要时，注入到上下文中
 */
export function buildSummarySection(summary: string): string {
  if (!summary) return "";

  return `
<history_summary>
以下是之前对话的摘要：
${summary}
</history_summary>

`;
}
