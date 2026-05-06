/**
 * Login 页面 Loading
 */
export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--app-bg)]">
      <div className="w-full max-w-sm px-6">
        {/* 表单骨架 */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface)] animate-pulse" />
          </div>

          {/* 标题 */}
          <div className="h-8 w-32 mx-auto rounded bg-[var(--surface)] animate-pulse" />

          {/* 输入框 */}
          <div className="space-y-4">
            <div className="h-12 rounded-lg bg-[var(--surface)] animate-pulse" />
            <div className="h-12 rounded-lg bg-[var(--surface)] animate-pulse" />
          </div>

          {/* 按钮 */}
          <div className="h-12 rounded-lg bg-[var(--surface-secondary)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
