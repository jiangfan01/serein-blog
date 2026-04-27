"use client";

import { Suspense, useRef, useState, useEffect, lazy } from "react";
import type { ComponentType, ReactNode } from "react";

interface LazyWrapperProps {
  /** Factory function returning a dynamic import promise */
  factory: () => Promise<{ default: ComponentType<any> }>;
  /** React node displayed while the component is loading */
  fallback: ReactNode;
  /** IntersectionObserver rootMargin — how far ahead of viewport to trigger */
  rootMargin?: string;
  /** IntersectionObserver threshold — intersection ratio to trigger */
  threshold?: number;
  /** Props forwarded to the lazily loaded component */
  componentProps?: Record<string, unknown>;
}

/**
 * Viewport-triggered lazy loading wrapper.
 *
 * Renders a sentinel `<div>` with the `fallback` content. When the sentinel
 * enters the viewport (controlled by `rootMargin` and `threshold`), the
 * `factory` is called to dynamically import the target component, which is
 * then rendered inside a `<Suspense>` boundary.
 *
 * The observer disconnects after the first intersection (one-shot).
 * If `IntersectionObserver` is not available, the component loads immediately.
 */
export default function LazyWrapper({
  factory,
  fallback,
  rootMargin = "200px",
  threshold = 0,
  componentProps,
}: LazyWrapperProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [LazyComponent, setLazyComponent] =
    useState<ComponentType<any> | null>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, load immediately
    if (typeof IntersectionObserver === "undefined") {
      const Component = lazy(factory);
      setLazyComponent(() => Component);
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const Component = lazy(factory);
            setLazyComponent(() => Component);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [factory, rootMargin, threshold]);

  if (LazyComponent) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...componentProps} />
      </Suspense>
    );
  }

  return <div ref={sentinelRef}>{fallback}</div>;
}
