"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function IntroAnimation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    // Check if animation has already played in this session
    const animationPlayed = sessionStorage.getItem('intro-animation-played');
    
    if (animationPlayed === 'true') {
      setHasPlayed(true);
      return;
    }

    const section = sectionRef.current;
    const overlay = overlayRef.current;
    const title = titleRef.current;
    const hint = hintRef.current;

    if (!section || !overlay || !title || !hint) return;

    // Title fade in animation (not affected by scroll)
    gsap.fromTo(title, 
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.3 }
    );

    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(overlay, {
        clipPath: "circle(100% at 50% 50%)",
      });
      gsap.set(hint, {
        opacity: 0.6,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=1600",
          scrub: 1.2,
          pin: true,
          anticipatePin: 1,
          onLeave: () => {
            // Mark animation as played when user scrolls past it
            sessionStorage.setItem('intro-animation-played', 'true');
          }
        },
      });

      // Only animate hint and circle, NOT the title
      tl.to(hint, {
        opacity: 0,
        duration: 2,
        ease: "power2.in",
      }, 0);

      // Circle shrinks from center
      tl.to(overlay, {
        clipPath: "circle(0% at 50% 50%)",
        duration: 8,
        ease: "power3.inOut",
      }, 2);
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  // If animation has already played, don't render it
  if (hasPlayed) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative z-50 h-screen overflow-hidden"
      style={{ 
        backgroundColor: "var(--app-bg)",
      }}
    >
      {/* Overlay that shrinks to reveal content */}
      <div
        ref={overlayRef}
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          backgroundColor: "var(--surface-inverse)",
        }}
      >
        <h1 
          ref={titleRef}
          className="text-[clamp(2.5rem,6vw,5rem)] font-bold tracking-[-0.04em] leading-[1.1] opacity-0"
          style={{ 
            color: "var(--text-inverse)",
            textAlign: "center",
          }}
        >
          Serein Blog
        </h1>

        <div
          ref={hintRef}
          className="absolute bottom-12 flex flex-col items-center gap-3"
        >
          <p 
            className="text-sm tracking-[0.2em]"
            style={{ 
              color: "var(--text-inverse)",
              opacity: 0.4,
            }}
          >
            向下滚动进入
          </p>
          <div 
            className="h-12 w-[1px] animate-pulse"
            style={{ 
              background: "linear-gradient(to bottom, transparent, var(--text-inverse), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
