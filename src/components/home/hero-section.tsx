"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * HeroSection — above-the-fold hero with staggered GSAP fade-in-up.
 *
 * Renders a full-viewport centered layout containing:
 *   • mono-spaced role label
 *   • display-weight name heading
 *   • secondary tagline
 *   • primary + secondary CTA links
 *
 * Animation: each `[data-hero]` element fades in from below with a
 * stagger. When `prefers-reduced-motion` is active the elements are
 * shown at their final state immediately via `gsap.set()`.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const els = sectionRef.current?.querySelectorAll("[data-hero]");
      if (!els?.length) return;

      if (prefersReducedMotion) {
        // Immediately show elements at their final state
        gsap.set(els, { y: 0, opacity: 1 });
        return;
      }

      gsap.fromTo(
        els,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.2,
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center px-6 md:px-16"
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Mono-spaced role label */}
        <p
          data-hero
          className="font-mono text-[11px] tracking-[0.3em] uppercase text-[var(--accent)] mb-10 opacity-0"
        >
          全栈工程师 · AI 应用开发
        </p>

        {/* Name */}
        <h1
          data-hero
          className="text-[var(--font-size-hero)] font-extrabold tracking-[-0.04em] leading-[0.95] text-[var(--text-strong)] mb-8 opacity-0"
        >
          Serein
        </h1>

        {/* Tagline */}
        <p
          data-hero
          className="text-[var(--text-strong)]/80 text-lg md:text-xl leading-relaxed max-w-xl mx-auto mb-14 opacity-0"
        >
          构建 AI 驱动的 Web 应用，从前端架构到 Agent 编排
        </p>

        {/* CTA links */}
        <div
          data-hero
          className="flex items-center justify-center gap-8 opacity-0"
        >
          {/* Primary CTA */}
          <Link
            href="/notes"
            className="group inline-flex items-center gap-2 text-[var(--accent)] text-base font-semibold hover:opacity-80 transition-opacity"
          >
            <span>查看笔记</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA */}
          <Link
            href="/chat"
            className="group inline-flex items-center gap-2 text-[var(--text-strong)] text-base font-semibold hover:text-[var(--accent)] transition-colors"
          >
            <span>AI 对话</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
