/**
 * Model Stats 页面 Loading
 * 
 * 统计图表骨架屏
 */
export default function ModelStatsLoading() {
  return (
    <div className="min-h-[60vh] py-16 px-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <div className="h-8 w-40 rounded-lg bg-[var(--surface)] animate-pulse mb-3" />
          <div className="h-4 w-64 rounded bg-[var(--surface-secondary)] animate-pulse" />
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="h-4 w-16 rounded bg-[var(--surface-secondary)] mb-2" />
              <div className="h-8 w-20 rounded bg-[var(--surface-secondary)]" />
            </div>
          ))}
        </div>

        {/* 图表骨架 */}
        <div className="h-64 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] animate-pulse" />
      </div>
    </div>
  );
}
