/**
 * 配置模块统一导出
 */

export * from "./constants";

// 回答风格配置（从原位置重新导出）
export {
  RESPONSE_STYLES,
  getStyleOptions,
  getStylePrompt,
  isValidStyleKey,
  type ResponseStyleKey,
  type ResponseStyle,
} from "../response-styles";
