/**
 * About 页面 Loading
 */
export default function AboutLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse [animation-delay:160ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] animate-pulse [animation-delay:320ms]" />
      </div>
    </div>
  );
}
