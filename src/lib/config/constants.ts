/**
 * 全局常量配置
 *
 * 集中管理项目中的常量，避免魔法数字散落各处
 */

// ============ 分页配置 ============

/** 会话列表默认每页数量 */
export const SESSION_PAGE_SIZE = 20;

/** 会话列表最大每页数量 */
export const SESSION_PAGE_SIZE_MAX = 50;

/** 消息列表默认每页数量 */
export const MESSAGE_PAGE_SIZE = 50;

// ============ 限制配置 ============

/** 会话标题最大长度 */
export const SESSION_TITLE_MAX_LENGTH = 100;

/** 会话标题截取长度（自动生成时） */
export const SESSION_TITLE_TRUNCATE_LENGTH = 50;

/** 用户默认每日调用限制 */
export const DEFAULT_DAILY_LIMIT = 100;

// ============ 断线重连配置 ============

/** 执行进度更新间隔（毫秒） */
export const EXECUTION_PROGRESS_UPDATE_INTERVAL = 300;

// ============ Agent 配置 ============

/** 最大历史消息数量（多轮对话） */
export const MAX_HISTORY_MESSAGES = 20;

/** 工具结果预览最大长度 */
export const TOOL_RESULT_PREVIEW_MAX_LENGTH = 2000;

// ============ SSE 配置 ============

/** SSE 心跳间隔（毫秒） */
export const SSE_HEARTBEAT_INTERVAL = 30000;
