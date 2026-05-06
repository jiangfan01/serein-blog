/**
 * About 页面 Loading
 */
export default function AboutLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]"
            style={{
              animation: "pulse-dot 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>

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
