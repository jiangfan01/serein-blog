import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export function Logo({
  className,
  markClassName,
  textClassName,
  showText = true,
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className={markClassName} />
      {showText ? (
        <div className={cn("flex items-baseline gap-2", textClassName)}>
          <span className="text-[var(--font-size-caption)] font-semibold uppercase tracking-[0.32em]">
            Serein
          </span>
          <span className="text-[var(--font-size-micro)] uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
            Blog
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      {/* 标准 S */}
      <path
        d="M21 6 C21 6 19 4 15 4 C10 4 7 6.5 7 10 C7 13.5 10 15 16 16 C22 17 25 19 25 22.5 C25 26 22 28 17 28 C13 28 11 26 11 26"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        className="text-[var(--accent)]"
      />
      {/* 雨滴 */}
      <circle cx="8" cy="29" r="1.5" fill="currentColor" className="text-[var(--accent)]"/>
      <circle cx="4" cy="25" r="1" fill="currentColor" className="text-[var(--accent)]"/>
      <circle cx="3" cy="20" r="1" fill="currentColor" className="text-[var(--accent)]"/>
    </svg>
  );
}
