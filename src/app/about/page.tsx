export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-14 md:px-10">
      <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
        About
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
        Frontend engineer focused on AI products, workflow systems, and streaming UX.
      </h1>
      <div className="space-y-5 rounded-[1.75rem] border border-black/5 bg-white p-8 text-base leading-8 text-slate-600 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <p>
          This site is where I am consolidating my engineering profile into one
          place: portfolio pages for product work, structured notes for interview
          prep, and long-form docs for AI frontend architecture.
        </p>
        <p>
          The first focus is practical material: SSE multi-session streaming,
          workflow orchestration, React performance, TypeScript utilities, and
          production trade-offs in AI applications.
        </p>
      </div>
    </div>
  );
}
