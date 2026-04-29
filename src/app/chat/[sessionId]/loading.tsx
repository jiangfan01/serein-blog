/**
 * 会话页骨架屏
 */
export default function SessionLoading() {
  return (
    <>
      {/* 消息区域骨架 */}
      <div className="flex-1 overflow-y-auto" data-lenis-prevent>
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
          {/* 用户消息骨架 */}
          <div className="flex justify-end">
            <div className="max-w-[80%] space-y-2">
              <div className="h-4 w-48 bg-[var(--surface-secondary)] rounded animate-pulse" />
            </div>
          </div>

          {/* AI 消息骨架 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3 w-20 bg-[var(--surface-secondary)] rounded animate-pulse" />
            </div>
            <div className="pl-8 space-y-2">
              <div className="h-4 w-full bg-[var(--surface-secondary)] rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-[var(--surface-secondary)] rounded animate-pulse" />
              <div className="h-4 w-3/5 bg-[var(--surface-secondary)] rounded animate-pulse" />
            </div>
          </div>

          {/* 用户消息骨架 */}
          <div className="flex justify-end">
            <div className="max-w-[80%] space-y-2">
              <div className="h-4 w-32 bg-[var(--surface-secondary)] rounded animate-pulse" />
            </div>
          </div>

          {/* AI 消息骨架 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--surface-secondary)] animate-pulse" />
              <div className="h-3 w-20 bg-[var(--surface-secondary)] rounded animate-pulse" />
            </div>
            <div className="pl-8 space-y-2">
              <div className="h-4 w-full bg-[var(--surface-secondary)] rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-[var(--surface-secondary)] rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* 输入区骨架 */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-4">
          <div className="h-12 bg-[var(--surface-secondary)] rounded-xl animate-pulse" />
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-3 w-48 bg-[var(--surface-secondary)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
}
