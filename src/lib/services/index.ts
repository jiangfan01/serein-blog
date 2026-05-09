/**
 * 服务层统一导出
 *
 * 服务层负责业务逻辑，是 API Route 和数据层之间的桥梁。
 * API Route 只做请求处理，具体业务逻辑委托给 Service。
 */

// 用户服务
export {
  checkUserChatAccess,
  getUserPreferences,
  updateUserPreferences,
  type UserAccessResult,
} from "./user.service";

// 会话服务
export {
  getUserSessions,
  createSession,
  getSession,
  verifySessionOwnership,
  updateSession,
  deleteSession,
  updateSessionTitle,
  touchSession,
  type SessionListItem,
  type SessionListResult,
} from "./session.service";

// 消息服务
export {
  createUserMessage,
  createAssistantMessage,
  createExecution,
  updateExecutionProgress,
  completeExecution,
  failExecution,
  interruptExecution,
  getLatestExecution,
  getExecution,
  getSessionMessages,
  type ToolCallRecord,
  type MessageMetadata,
  type ExecutionProgress,
} from "./message.service";

// 聊天服务
export {
  initializeChat,
  handleSSEEvent,
  finalizeChat,
  handleChatError,
  handleClientDisconnect,
  createChatContext,
  runChatAgent,
  encodeSSE,
  type ChatRequest,
} from "./chat.service";
