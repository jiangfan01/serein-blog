/**
 * 全局 Loading 组件
 * 
 * 极简设计：呼吸感的圆点 + 品牌标识
 */
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      {/* 呼吸动画圆点 */}
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse [animation-delay:160ms]" />
        <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-pulse [animation-delay:320ms]" />
      </div>
      
      {/* 品牌文字 */}
      <span className="text-[11px] font-medium text-[var(--text-quaternary)] uppercase tracking-[0.2em]">
        Serein
      </span>
    </div>
  );
}
