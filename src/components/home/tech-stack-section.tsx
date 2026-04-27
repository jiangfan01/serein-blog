"use client";

import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { techGroups } from "./tech-groups-data";
import { techStack } from "@/data/tech-stack";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * TechStackSection — scroll-animated tech stack grid.
 *
 * Renders a section header followed by numbered tech groups in a
 * 12-column grid (number · title · items). Each group fades in via
 * GSAP ScrollTrigger as it enters the viewport, with child items
 * staggering in shortly after.
 *
 * When `prefers-reduced-motion` is active, elements are shown at
 * their final state immediately via `gsap.set()` — no ScrollTrigger
 * instances are created.
 *
 * Collapses to a stacked layout below the `md` breakpoint.
 *
 * Exported as default for React.lazy compatibility.
 */
function TechStackSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const groups = sectionRef.current?.querySelectorAll("[data-tech-group]");
      if (!groups?.length) return;

      if (prefersReducedMotion) {
        // Show everything at final state immediately
        gsap.set(groups, { y: 0, opacity: 1 });
        groups.forEach((group) => {
          const items = group.querySelectorAll("[data-tech-item]");
          if (items.length) gsap.set(items, { y: 0, opacity: 1 });
        });
        return;
      }

      // Animate each group + its items on scroll
      groups.forEach((group) => {
        gsap.fromTo(
          group,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: group,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        );

        const items = group.querySelectorAll("[data-tech-item]");
        if (items.length) {
          gsap.fromTo(
            items,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.1,
              scrollTrigger: {
                trigger: group,
                start: "top 80%",
                toggleActions: "play none none none",
              },
            },
          );
        }
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
            技术能力
          </p>
          <h2 className="text-[var(--font-size-display)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--text-strong)]">
            技术栈
          </h2>
        </div>

        {/* Groups */}
        <div className="space-y-0">
          {techGroups.map((group) => {
            const items = techStack.filter((t) =>
              group.categories.includes(t.category),
            );
            return (
              <div
                key={group.num}
                data-tech-group
                className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 py-14 border-t border-[var(--border-subtle)] opacity-0"
              >
                {/* Number */}
                <div className="md:col-span-1">
                  <span className="font-mono text-sm text-[var(--accent)] tabular-nums">
                    {group.num}
                  </span>
                </div>

                {/* Group title */}
                <div className="md:col-span-3">
                  <h3 className="text-lg font-semibold text-[var(--text-strong)] tracking-tight">
                    {group.title}
                  </h3>
                </div>

                {/* Tech items */}
                <div className="md:col-span-8">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-10 gap-y-5">
                    {items.map((tech) => (
                      <a
                        key={tech.name}
                        href={tech.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-tech-item
                        className="group/item flex items-start gap-2.5 opacity-0"
                      >
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 opacity-60 group-hover/item:opacity-100 transition-opacity" />
                        <div className="flex flex-col">
                          <span className="text-[var(--text-strong)] text-[15px] font-medium group-hover/item:text-[var(--accent)] transition-colors">
                            {tech.name}
                          </span>
                          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--accent)]/60">
                            {tech.category}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {/* Bottom border for last group */}
          <div className="border-t border-[var(--border-subtle)]" />
        </div>
      </div>
    </section>
  );
}

export default TechStackSection;
