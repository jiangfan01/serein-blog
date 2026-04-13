const projects = [
  {
    title: "AI Workflow Builder",
    description:
      "A visual workflow product for graph editing, stage orchestration, and agent configuration.",
    tags: ["React Flow", "Zustand", "TypeScript"],
  },
  {
    title: "Streaming Chat Platform",
    description:
      "A multi-session chat architecture built around SSE parsing, singleton connection management, and buffered rendering.",
    tags: ["SSE", "ReadableStream", "React"],
  },
  {
    title: "Agent + Tool Playground",
    description:
      "A place to experiment with LangChain-style tool calling, retrieval, and basic agent workflows.",
    tags: ["Agents", "Tools", "LLM Apps"],
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-14 md:px-10">
      <div className="max-w-3xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
          Projects
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Product work, architecture writeups, and experiments worth showing.
        </h1>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {projects.map((project) => (
          <article
            key={project.title}
            className="rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {project.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {project.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
