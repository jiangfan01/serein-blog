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
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]"
            style={{
              animation: "pulse-dot 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      
      {/* 品牌文字 */}
      <span className="text-[11px] font-medium text-[var(--text-quaternary)] uppercase tracking-[0.2em]">
        Serein
      </span>

      <style jsx>{`
        @keyframes pulse-dot {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
