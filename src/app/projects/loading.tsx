/**
 * Projects 页面 Loading
 * 
 * 卡片骨架屏
 */
export default function ProjectsLoading() {
  return (
    <div className="min-h-[60vh] py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* 标题骨架 */}
        <div className="mb-12">
          <div className="h-10 w-48 rounded-lg bg-[var(--surface)] animate-pulse mb-4" />
          <div className="h-5 w-72 rounded bg-[var(--surface-secondary)] animate-pulse" />
        </div>

        {/* 项目卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* 图标 */}
              <div className="w-12 h-12 rounded-xl bg-[var(--surface-secondary)] mb-4" />
              
              {/* 标题 */}
              <div className="h-6 w-2/3 rounded bg-[var(--surface-secondary)] mb-3" />
              
              {/* 描述 */}
              <div className="space-y-2">
                <div className="h-4 rounded bg-[var(--surface-secondary)]" />
                <div className="h-4 w-4/5 rounded bg-[var(--surface-secondary)]" />
              </div>

              {/* 标签 */}
              <div className="flex gap-2 mt-4">
                <div className="h-6 w-16 rounded-full bg-[var(--surface-secondary)]" />
                <div className="h-6 w-20 rounded-full bg-[var(--surface-secondary)]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
