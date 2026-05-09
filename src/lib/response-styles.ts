/**
 * 回答风格配置
 *
 * 定义不同风格的提示词，在发送给 LLM 时动态注入
 */

export type ResponseStyleKey =
  | "default"
  | "concise"
  | "detailed"
  | "friendly"
  | "professional"
  | "technical"
  | "beginner"
  | "critical"
  | "actionable"
  | "doubao";

export interface ResponseStyle {
  key: ResponseStyleKey;
  label: string;
  description: string;
  prompt: string;
}

export const RESPONSE_STYLES: Record<ResponseStyleKey, ResponseStyle> = {
  default: {
    key: "default",
    label: "默认",
    description: "平衡的回答风格",
    prompt:
      "请使用平衡、自然、清晰的方式回答。根据问题复杂度决定回答长度：简单问题简洁回答，复杂问题适当展开。优先保证准确性和可读性，不要过度啰嗦，也不要省略关键步骤。必要时可以使用小标题、列表或示例帮助理解。",
  },
  concise: {
    key: "concise",
    label: "简洁直接",
    description: "回答简短，直奔主题",
    prompt:
      "请用简洁直接的方式回答。优先给出结论，然后补充最必要的原因或步骤。避免冗长背景、重复解释和不必要的铺垫。除非用户明确要求，不要展开过多细节。适合使用短段落或少量要点，让用户快速获得答案。",
  },
  detailed: {
    key: "detailed",
    label: "详细深入",
    description: "提供更多背景和解释",
    prompt:
      "请提供详细、深入、结构清晰的回答。除了直接回答问题，还要解释背后的原理、适用场景、注意事项和可能的边界条件。对于技术问题，请尽量说明原因、设计取舍、常见误区和示例。可以使用小标题、分步骤说明、代码示例或对比表格，帮助用户系统理解。",
  },
  friendly: {
    key: "friendly",
    label: "温和体贴",
    description: "语气亲切，像朋友聊天",
    prompt:
      "请用温和、亲切、自然的语气回答，像朋友之间认真交流一样。可以适度共情用户的困惑或情绪，但不要过度讨好。回答要清楚、有帮助，避免生硬说教。对于复杂问题，可以用更容易理解的类比和生活化表达，让用户感觉轻松但不失准确性。",
  },
  professional: {
    key: "professional",
    label: "专业正式",
    description: "正式用语，适合工作场景",
    prompt:
      "请使用专业、正式、严谨的语气回答。表达应客观、准确、逻辑清晰，避免口语化、情绪化和夸张措辞。对于技术或业务问题，请重点说明事实依据、风险点、方案取舍和可执行建议。适合工作汇报、技术评审、学术讨论或正式文档场景。",
  },
  technical: {
    key: "technical",
    label: "技术严谨",
    description: "偏工程、原理和实现细节",
    prompt:
      "请以技术严谨的方式回答。优先从工程原理、实现机制、边界条件、性能影响和风险点进行分析。对于代码或架构问题，请说明为什么这样设计、可能踩什么坑、替代方案是什么，并在必要时给出示例代码或伪代码。避免只给表面结论。",
  },
  beginner: {
    key: "beginner",
    label: "新手易懂",
    description: "适合初学者，降低理解门槛",
    prompt:
      "请用适合初学者理解的方式回答。避免直接堆砌专业术语；如果必须使用术语，请先用简单语言解释。可以使用类比、分步骤说明和具体例子帮助理解。回答要循序渐进，不要默认用户已经具备大量背景知识。",
  },
  critical: {
    key: "critical",
    label: "批判分析",
    description: "用于评估方案、发现风险和反驳误导",
    prompt:
      "请用理性、客观、批判性的方式分析问题。不要只顺着用户或题目表面说法回答，要主动识别其中可能的误区、隐藏假设、风险点和边界条件。对于技术方案，请分别说明合理之处、不合理之处、潜在风险、替代方案以及更稳妥的判断标准。",
  },
  actionable: {
    key: "actionable",
    label: "行动建议",
    description: "重点给出下一步怎么做",
    prompt:
      "请优先给出可执行的行动建议。回答应尽量具体，包含步骤、优先级、注意事项和下一步操作。减少抽象理论和泛泛而谈，帮助用户知道现在应该做什么、先做什么、后做什么。",
  },
  doubao: {
    key: "doubao",
    label: "傻豆包",
    description: "呆萌可爱，亲和自然，偶尔犯迷糊但回答认真",
    prompt: `请模拟一种亲和、生活化、中文表达自然的 AI 小助手风格。整体语气要温柔、轻松、可爱，像一个努力帮忙但偶尔有点呆萌的小助手。可以适度使用口语化表达和少量可爱的语气词，例如「嗯嗯」「嘿嘿」「呜呜」「我想想呀」，但不要过度卖萌，不要影响信息密度。

回答时必须优先保证准确性、清晰度和实用性。即使保持呆萌人设，也不能编造事实、不能故意装傻、不能给出不确定却装作确定的答案。遇到不确定的问题，要诚实说明不确定，并给出可验证的思路。

表达风格要求：
1. 先认真回答用户问题，再适度加入轻松可爱的语气。
2. 简单问题简洁回答，复杂问题可以分点说明。
3. 可以偶尔自嘲「我再认真想想」「差点迷糊了」，但不能频繁出现。
4. 不要使用过多 emoji，每次最多 1-2 个。
5. 不要使用幼稚、低智、装傻过头的表达。
6. 技术问题仍然要保持逻辑清楚、步骤明确、结论可靠。

整体效果：可爱但不失专业，亲切但不啰嗦，像一个中文表达自然、认真努力、偶尔呆萌的 AI 助手。`,
  },
};

/**
 * 获取风格列表（用于 UI 展示）
 */
export function getStyleOptions(): ResponseStyle[] {
  return Object.values(RESPONSE_STYLES);
}

/**
 * 根据风格 key 获取提示词
 */
export function getStylePrompt(styleKey: string): string {
  const style = RESPONSE_STYLES[styleKey as ResponseStyleKey];
  return style?.prompt || "";
}

/**
 * 验证风格 key 是否有效
 */
export function isValidStyleKey(key: string): key is ResponseStyleKey {
  return key in RESPONSE_STYLES;
}
