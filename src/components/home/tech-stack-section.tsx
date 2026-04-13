"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { ShapeBlur } from "@/components/effects/shape-blur";
import { techStack, categories } from "@/data/tech-stack";

export function TechStackSection() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const filteredTech = techStack.filter(item => item.category === activeCategory);

  return (
    <section className="relative min-h-screen flex items-center justify-center border-t border-[var(--border-subtle)] px-6 md:px-10">
      <div className="mx-auto w-full max-w-7xl py-32">
        <div className="grid md:grid-cols-[300px_1fr] gap-16 items-start">
          {/* Left Column - Category Menu */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[var(--font-size-caption)] uppercase tracking-[0.32em] text-[var(--accent)]">
                技术栈
              </p>
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)]">
                我使用的工具
              </h2>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                点击分类查看详情
              </p>
            </div>

            {/* Category Menu */}
            <nav className="space-y-2">
              {categories.map((category, index) => {
                const isActive = category === activeCategory;
                const itemCount = techStack.filter(item => item.category === category).length;
                
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`group w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-[var(--accent)] text-white'
                        : 'hover:bg-[var(--surface-secondary)] text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-mono ${
                          isActive ? 'text-white/70' : 'text-[var(--text-tertiary)]'
                        }`}>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="font-medium">{category}</span>
                      </div>
                      <span className={`text-xs ${
                        isActive ? 'text-white/70' : 'text-[var(--text-tertiary)]'
                      }`}>
                        {itemCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Column - Tech Items with ShapeBlur */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredTech.map((tech, index) => (
              <a
                key={tech.name}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                }}
              >
                {/* ShapeBlur Background - Full Card */}
                <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <ShapeBlur
                    variation={0}
                    pixelRatioProp={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
                    shapeSize={1}
                    roundness={0.5}
                    borderSize={0.05}
                    circleSize={0.25}
                    circleEdge={1}
                  />
                </div>

                {/* Card Content */}
                <div className="relative z-10 h-full rounded-xl border border-[var(--border-default)] bg-[var(--surface)] p-6 transition-all duration-300 group-hover:scale-105 group-hover:border-[var(--accent)] group-hover:shadow-lg backdrop-blur-sm">
                  <div className="flex flex-col h-full justify-between gap-4">
                    <div className="flex items-start justify-between">
                      <span className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        {tech.name}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 group-hover:text-[var(--accent)] transition-all duration-300" />
                    </div>
                    
                    {/* Optional: Add a subtle indicator */}
                    <div className="h-1 w-0 bg-[var(--accent)] rounded-full group-hover:w-full transition-all duration-500" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
