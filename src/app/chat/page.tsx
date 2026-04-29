import { Suspense } from "react";
import { ChatPage } from "@/components/chat/chat-page";

export const metadata = {
  title: "AI Chat",
};

/**
 * 加载中占位
 */
function ChatLoading() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-[var(--app-bg)]">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
        <span className="text-[14px] text-[var(--text-secondary)]">加载中...</span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPage />
    </Suspense>
  );
}
