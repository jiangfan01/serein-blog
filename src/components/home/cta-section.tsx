"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * CTASection — scroll-animated closing call-to-action block.
 *
 * Renders a centered layout containing:
 *   • display-weight heading
 *   • secondary description paragraph
 *   • primary (filled) and secondary (outlined) CTA links
 *
 * Animation: each `[data-cta]` element fades in from below with a
 * stagger via GSAP ScrollTrigger when the section enters the viewport.
 *
 * When `prefers-reduced-motion` is active, elements are shown at
 * their final state immediately via `gsap.set()` — no ScrollTrigger
 * instances are created.
 *
 * Exported as default for React.lazy compatibility.
 */
function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const els = sectionRef.current?.querySelectorAll("[data-cta]");
      if (!els?.length) return;

      if (prefersReducedMotion) {
        gsap.set(els, { y: 0, opacity: 1 });
        return;
      }

      gsap.fromTo(
        els,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <section
      ref={sectionRef}
      className="py-40 px-6 md:px-16 text-center relative z-10"
    >
      <div className="max-w-2xl mx-auto">
        {/* Display heading */}
        <h2
          data-cta
          className="text-[clamp(2.5rem,5vw,4rem)] font-bold tracking-[-0.03em] leading-[1.1] text-[var(--text-strong)] mb-6 opacity-0"
        >
          准备好了吗？
        </h2>

        {/* Description */}
        <p
          data-cta
          className="text-[var(--text-strong)]/80 text-lg leading-relaxed mb-14 opacity-0"
        >
          查看我的技术笔记，或者直接和 AI 助手对话
        </p>

        {/* CTA links */}
        <div
          data-cta
          className="flex items-center justify-center gap-5 opacity-0"
        >
          {/* Primary CTA — filled */}
          <Link
            href="/notes"
            className="group inline-flex items-center gap-2 text-[var(--accent)] text-base font-semibold hover:opacity-80 transition-opacity"
          >
            <span>技术笔记</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* Secondary CTA — outlined */}
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

export default CTASection;
