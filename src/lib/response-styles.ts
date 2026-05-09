/**
 * 回答风格配置
 * 
 * 定义不同风格的提示词，在发送给 LLM 时动态注入
 */

export type ResponseStyleKey = "default" | "concise" | "detailed" | "friendly" | "professional";

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
    prompt: "", // 默认不添加额外提示
  },
  concise: {
    key: "concise",
    label: "简洁直接",
    description: "回答简短，直奔主题",
    prompt: "请用简洁直接的方式回答，避免冗长的解释，直奔主题。",
  },
  detailed: {
    key: "detailed",
    label: "详细深入",
    description: "提供更多背景和解释",
    prompt: "请提供详细深入的回答，包含必要的背景知识、原理解释和示例。",
  },
  friendly: {
    key: "friendly",
    label: "温和体贴",
    description: "语气亲切，像朋友聊天",
    prompt: "请用温和亲切的语气回答，像朋友之间的对话一样自然轻松。",
  },
  professional: {
    key: "professional",
    label: "专业正式",
    description: "正式用语，适合工作场景",
    prompt: "请用专业正式的语气回答，措辞严谨，适合工作和学术场景。",
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
