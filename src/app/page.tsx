import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-14 md:px-10 md:py-20">
      <section className="grid gap-8 rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-[1.4fr_0.9fr] md:p-12">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--accent)]">
            AI Engineering Portfolio
          </p>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Serein Blog is the place for my products, notes, and AI frontend architecture work.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              Built with Next.js, Prisma, PostgreSQL, Zustand, TanStack Query,
              Tailwind and Nextra. This site is meant to become both a
              portfolio and a working knowledge base.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/notes"
            >
              Open Notes
            </Link>
            <Link
              className="inline-flex items-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              href="/projects"
            >
              View Projects
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_55%),linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-6 text-slate-100">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-200/80">
              Stack
            </p>
            <p className="mt-2 text-2xl font-semibold">Modern, pragmatic, portable</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Next.js App Router for the product shell
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Nextra under <code>/notes</code> for docs, interview prep, and题解
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Prisma + PostgreSQL for future dynamic content and metadata
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-slate-900">Projects</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Showcase AI workflow tooling, SSE streaming architecture, agent
            demos, and full-stack experiments.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-slate-900">Notes</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Use Nextra to capture interview prep, algorithm notes, React
            internals, workflow systems, and AI frontend patterns.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-slate-900">Platform</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Keep the product shell clean: App Router pages for narrative and
            portfolio, docs theme for structured learning content.
          </p>
        </div>
      </section>
    </div>
  );
}
