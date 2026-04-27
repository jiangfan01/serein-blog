"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "./projects-data";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * ProjectsSection — scroll-animated project cards with alternating layout.
 *
 * Renders a section header followed by project cards in an alternating
 * left/right 12-column grid. Even-indexed cards slide in from the left,
 * odd-indexed cards slide in from the right via GSAP ScrollTrigger.
 *
 * When `prefers-reduced-motion` is active, elements are shown at their
 * final state immediately via `gsap.set()` — no ScrollTrigger instances
 * are created.
 *
 * Stacks vertically below the `md` breakpoint.
 *
 * Exported as default for React.lazy compatibility.
 */
function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards =
        sectionRef.current?.querySelectorAll("[data-project]");
      if (!cards?.length) return;

      if (prefersReducedMotion) {
        gsap.set(cards, { x: 0, opacity: 1 });
        return;
      }

      cards.forEach((card, i) => {
        const fromLeft = i % 2 === 0;
        gsap.fromTo(
          card,
          { x: fromLeft ? -60 : 60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section ref={sectionRef} className="py-32 px-6 md:px-16 relative z-10">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="mb-24">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-[var(--accent)] mb-4">
            项目经历
          </p>
          <h2 className="text-[var(--font-size-display)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--text-strong)]">
            项目
          </h2>
        </div>

        {/* Project list */}
        <div className="space-y-28">
          {projects.map((project, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={project.id} data-project className="opacity-0">
                <div
                  className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start ${
                    isEven ? "" : "md:direction-rtl"
                  }`}
                >
                  {/* Left column: number + meta */}
                  <div
                    className={`md:col-span-4 ${
                      isEven ? "md:order-1" : "md:order-2"
                    }`}
                    style={{ direction: "ltr" }}
                  >
                    <span className="block font-mono text-[clamp(4rem,8vw,6rem)] font-black leading-none text-[var(--text-strong)] opacity-[0.06] select-none mb-4">
                      {project.id}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-strong)] tracking-tight mb-3">
                      {project.title}
                    </h3>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[var(--accent)]">
                      {project.category}
                    </span>
                  </div>

                  {/* Right column: description + tags + link */}
                  <div
                    className={`md:col-span-8 ${
                      isEven ? "md:order-2" : "md:order-1"
                    }`}
                    style={{ direction: "ltr" }}
                  >
                    <p className="text-[var(--text-secondary)] text-base leading-[1.8] mb-8 max-w-2xl">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="font-mono text-[11px] tracking-wide text-[var(--text-tertiary)] px-3 py-1.5 bg-[var(--surface-secondary)] rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {project.url ? (
                      <Link
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      >
                        <span>查看项目</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                        内部项目
                      </span>
                    )}
                  </div>
                </div>

                {/* Divider */}
                {index < projects.length - 1 && (
                  <div className="mt-28 h-px bg-[var(--border-subtle)]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ProjectsSection;
