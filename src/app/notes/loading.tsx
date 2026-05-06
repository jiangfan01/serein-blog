/**
 * Notes 页面 Loading
 * 
 * 骨架屏：模拟文档结构
 */
export default function NotesLoading() {
  return (
    <div className="min-h-screen bg-[#111]">
      {/* 顶部导航骨架 */}
      <div className="h-16 border-b border-neutral-800 flex items-center px-6">
        <div className="w-24 h-5 rounded bg-neutral-800 animate-pulse" />
      </div>

      <div className="flex">
        {/* 侧边栏骨架 */}
        <aside className="hidden md:block w-64 border-r border-neutral-800 p-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 rounded-lg bg-neutral-800/50 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s`, width: `${70 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </aside>

        {/* 内容区骨架 */}
        <main className="flex-1 p-8 max-w-3xl">
          {/* 标题 */}
          <div className="h-10 w-2/3 rounded-lg bg-neutral-800 animate-pulse mb-6" />
          
          {/* 段落 */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 rounded bg-neutral-800/60 animate-pulse" style={{ width: `${85 + Math.random() * 15}%` }} />
                <div className="h-4 rounded bg-neutral-800/60 animate-pulse" style={{ width: `${70 + Math.random() * 20}%` }} />
                <div className="h-4 rounded bg-neutral-800/60 animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
              </div>
            ))}
          </div>

          {/* 代码块骨架 */}
          <div className="mt-8 h-32 rounded-lg bg-neutral-800/40 animate-pulse" />
        </main>
      </div>
    </div>
  );
}
