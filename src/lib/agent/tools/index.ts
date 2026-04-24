/**
 * 工具注册表
 *
 * 所有工具在这里统一注册和导出。
 * agent.ts 只从这里拿工具列表，不关心每个工具的内部实现。
 *
 * 以后加新工具只需要：
 * 1. 在 tools/ 下新建文件写实现
 * 2. 在这里 import 并加到 allTools 数组里
 */
import { ragSearchTool } from "./rag-search";
import { webSearchTool } from "./web-search";

// 所有可用工具的列表 — 会传给模型的 bindTools
export const allTools = [ragSearchTool, webSearchTool];

// 也单独导出，方便需要单独使用的场景
export { ragSearchTool, webSearchTool };
