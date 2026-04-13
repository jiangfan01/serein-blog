"use client";

import Lenis from "lenis";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // 在 notes 页面禁用 Lenis 平滑滚动
    const isNotesPage = pathname?.startsWith('/notes');
    if (isNotesPage) {
      // 确保 html 没有 lenis 相关 class
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
    });

    lenisRef.current = lenis;

    // Reset scroll position when route changes
    lenis.scrollTo(0, { immediate: true });

    // Refresh ScrollTrigger after scroll reset
    if (typeof window !== "undefined" && ScrollTrigger) {
      ScrollTrigger.refresh();
    }

    let frame = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };

    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname]); // Re-run when pathname changes

  return null;
}
