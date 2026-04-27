"use client";

import React, { Suspense } from "react";
import { IntroAnimation } from "@/components/intro/intro-animation-final";
import { HeroSection } from "./hero-section";
import LazyWrapper from "@/components/lazy/lazy-wrapper";

// LineWaves is a named export — bridge to default for React.lazy
const LazyLineWaves = React.lazy(() =>
  import("@/components/effects/line-waves").then((m) => ({
    default: m.LineWaves,
  })),
);

/* ── Skeleton fallbacks (min-height prevents layout shift) ── */

function TechStackSkeleton() {
  return <div style={{ minHeight: "100vh" }} />;
}

function ProjectsSkeleton() {
  return <div style={{ minHeight: "150vh" }} />;
}

function CTASkeleton() {
  return <div style={{ minHeight: "80vh" }} />;
}

/* ── Error boundary for LineWaves (renders nothing on failure) ── */

class LineWavesErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ── HomePage orchestrator ── */

export function HomePage() {
  return (
    <>
      {/* LineWaves WebGL background — lazy loaded, error-safe */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <LineWavesErrorBoundary>
          <Suspense fallback={<div className="w-full h-full" />}>
            <LazyLineWaves
              speed={0.3}
              innerLineCount={32}
              outerLineCount={36}
              warpIntensity={1}
              rotation={-45}
              edgeFadeWidth={0}
              colorCycleSpeed={1}
              brightness={0.2}
              color1="#2f9b92"
              color2="#2f9b92"
              color3="#2f9b92"
              enableMouseInteraction
              mouseInfluence={2}
            />
          </Suspense>
        </LineWavesErrorBoundary>
      </div>

      {/* IntroAnimation — initial bundle */}
      <IntroAnimation />

      <div className="relative">
        {/* Hero — initial bundle, above the fold */}
        <HeroSection />

        {/* Below-the-fold sections — lazy via LazyWrapper */}
        <LazyWrapper
          factory={() => import("./tech-stack-section")}
          fallback={<TechStackSkeleton />}
          rootMargin="600px"
        />

        <LazyWrapper
          factory={() => import("./projects-section")}
          fallback={<ProjectsSkeleton />}
          rootMargin="600px"
        />

        <LazyWrapper
          factory={() => import("./cta-section")}
          fallback={<CTASkeleton />}
          rootMargin="400px"
        />
      </div>
    </>
  );
}
