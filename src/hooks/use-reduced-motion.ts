"use client";

import { useState, useEffect } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Detects whether the user prefers reduced motion.
 *
 * Returns `true` when `prefers-reduced-motion: reduce` is active,
 * `false` otherwise. Returns `false` during SSR.
 * Listens for changes so the value updates if the user toggles
 * the system setting while the page is open.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(QUERY);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mql.addEventListener("change", handleChange);

    // Sync in case the value changed between initial render and effect
    setPrefersReducedMotion(mql.matches);

    return () => {
      mql.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
