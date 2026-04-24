"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import avatarImage from "@/assets/images/avatar.jpg";

gsap.registerPlugin(ScrollTrigger);

const experiences = [
  {
    period: "2025.08 — 至今",
    role: "前端开发工程师",
    company: "AI 应用平台",
    description: "负责 AI 对话平台研发，主导 SSE 流式响应、工作流画布、多维表格等核心模块开发。推动前端工程化建设，落地 monorepo 管理与 AI 协作开发规范。",
  },
  {
    period: "2024.07 — 2025.03",
    role: "前端开发工程师",
    company: "互联网公司（实习）",
    description: "负责官网前端开发与优化，使用 React + TypeScript + Ant Design 搭建业务系统。完成组件模块化封装、多端兼容性适配及页面性能优化。",
  },
];

const skills = {
  "核心": ["React", "Vue", "Next.js", "TypeScript"],
  "后端": ["Node.js", "Golang", "Gin", "Prisma"],
  "AI": ["LLM 集成", "Agent", "RAG"],
  "数据": ["MySQL", "PostgreSQL", "Redis"],
};

const contacts = [
  { label: "邮箱", value: "jf1431037397@gmail.com", href: "mailto:jf1431037397@gmail.com" },
  { label: "GitHub", value: "jiangfan01", href: "https://github.com/jiangfan01" },
  { label: "微信", value: "Devoted-serein" },
  { label: "电话", value: "136****8144" },
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 入场动画
      const elements = containerRef.current?.querySelectorAll("[data-animate]");
      if (!elements) return;

      gsap.set(elements, { opacity: 0, y: 40 });

      gsap.to(elements, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2,
      });

      // 头像滚动视差 + 缩放动画
      if (avatarRef.current && avatarWrapperRef.current) {
        gsap.to(avatarRef.current, {
          yPercent: 20,
          scale: 1.1,
          ease: "none",
          scrollTrigger: {
            trigger: avatarWrapperRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });

        // 装饰角的旋转动画
        const accentCorner = avatarWrapperRef.current.querySelector("[data-accent-corner]");
        if (accentCorner) {
          gsap.to(accentCorner, {
            rotation: 10,
            scale: 1.2,
            ease: "none",
            scrollTrigger: {
              trigger: avatarWrapperRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        }
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--app-bg)]">
      {/* Hero Section — Asymmetric Layout */}
      <section className="pt-32 pb-24 px-6 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-start">
            {/* Left: Typography Heavy */}
            <div className="lg:col-span-7 lg:pr-16">
              <div data-animate className="font-mono text-[var(--accent)] tracking-[0.4em] text-xs mb-8 uppercase">
                / 关于我
              </div>

              <h1 data-animate className="text-[clamp(3rem,8vw,6rem)] font-black text-[var(--text-strong)] tracking-tighter leading-[0.9] mb-8">
                Serein
                <br />
                <span className="text-[var(--text-tertiary)] text-[0.5em] font-normal tracking-normal">
                  /səˈreɪn/
                </span>
              </h1>

              <p data-animate className="text-2xl md:text-3xl text-[var(--text-secondary)] leading-relaxed mb-12 max-w-xl">
                构建可扩展的数字产品。
                <br />
                <span className="text-[var(--accent)]">专注 AI 应用与前端架构。</span>
              </p>

              <div data-animate className="flex items-center gap-6 text-[var(--text-tertiary)] font-mono text-sm">
                <span>24岁</span>
                <span className="w-1 h-1 bg-[var(--accent)] rounded-full" />
                <span>杭州</span>
                <span className="w-1 h-1 bg-[var(--accent)] rounded-full" />
                <span>2年经验</span>
              </div>
            </div>

            {/* Right: Portrait with Parallax */}
            <div className="lg:col-span-5" data-animate>
              <div 
                ref={avatarWrapperRef}
                className="relative aspect-[4/5] max-w-sm lg:max-w-none lg:ml-auto rounded-2xl overflow-hidden"
              >
                <div
                  ref={avatarRef}
                  className="absolute inset-[-10%] will-change-transform"
                >
                  <Image
                    src={avatarImage}
                    alt="Serein"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Accent corner overlay */}
                <div 
                  data-accent-corner
                  className="absolute bottom-0 right-0 w-20 h-20 bg-[var(--accent)] will-change-transform origin-bottom-right"
                  style={{ 
                    clipPath: "polygon(100% 0, 100% 100%, 0 100%)" 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy — Full Width Statement */}
      <section className="py-24 px-6 md:px-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <blockquote data-animate className="text-[clamp(1.5rem,4vw,2.5rem)] text-[var(--text-primary)] leading-relaxed max-w-4xl">
            “热衷于探索前沿技术与视觉美学。追逐新鲜热门的技术栈，痴迷于打造极致的用户体验。从前端的精雕细琢到后端的架构探索，永远保持好奇心。”
          </blockquote>
        </div>
      </section>

      {/* Experience — Architectural List (matching homepage style) */}
      <section className="py-24 px-6 md:px-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <div data-animate className="font-mono text-[var(--accent)] tracking-[0.4em] text-xs mb-16 uppercase">
            / 工作经历
          </div>

          <div className="space-y-0">
            {experiences.map((exp, index) => (
              <div
                key={index}
                data-animate
                className="group grid grid-cols-1 md:grid-cols-12 py-12 border-b border-[var(--border-subtle)] items-start hover:bg-[var(--surface-secondary)]/30 transition-colors -mx-6 px-6"
              >
                <div className="md:col-span-3 mb-4 md:mb-0">
                  <span className="font-mono text-sm text-[var(--text-tertiary)] group-hover:text-[var(--accent)] transition-colors">
                    {exp.period}
                  </span>
                </div>
                <div className="md:col-span-4 mb-4 md:mb-0">
                  <h3 className="text-xl font-bold text-[var(--text-strong)] mb-1">
                    {exp.role}
                  </h3>
                  <span className="text-[var(--text-tertiary)] text-sm">
                    {exp.company}
                  </span>
                </div>
                <div className="md:col-span-5">
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills — Grouped, Not Tag Cloud */}
      <section className="py-24 px-6 md:px-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <div data-animate className="font-mono text-[var(--accent)] tracking-[0.4em] text-xs mb-16 uppercase">
            / 技术能力
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {Object.entries(skills).map(([category, items]) => (
              <div key={category} data-animate>
                <h3 className="text-sm font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-6">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {items.map((skill) => (
                    <li
                      key={skill}
                      className="text-[var(--text-strong)] text-lg font-medium flex items-center gap-3 group"
                    >
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full opacity-60 group-hover:opacity-100 group-hover:shadow-[0_0_10px_rgba(47,155,146,0.6)] transition-all" />
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact — Minimal List */}
      <section className="py-24 px-6 md:px-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-5">
              <div data-animate className="font-mono text-[var(--accent)] tracking-[0.4em] text-xs mb-8 uppercase">
                / 联系方式
              </div>
              <h2 data-animate className="text-4xl md:text-5xl font-black text-[var(--text-strong)] tracking-tight leading-[1.1]">
                有想法？
                <br />
                <span className="text-[var(--accent)]">聊聊。</span>
              </h2>
            </div>

            <div className="lg:col-span-7 lg:pt-8">
              <div className="space-y-0">
                {contacts.map((contact) => (
                  <div
                    key={contact.label}
                    data-animate
                    className="group flex items-center justify-between py-6 border-b border-[var(--border-subtle)] hover:border-[var(--accent)]/50 transition-colors"
                  >
                    <span className="font-mono text-sm text-[var(--text-tertiary)] uppercase tracking-wider">
                      {contact.label}
                    </span>
                    {contact.href ? (
                      <a
                        href={contact.href}
                        target={contact.href.startsWith("http") ? "_blank" : undefined}
                        rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-[var(--text-strong)] font-medium hover:text-[var(--accent)] transition-colors"
                      >
                        {contact.value}
                      </a>
                    ) : (
                      <span className="text-[var(--text-strong)] font-medium">
                        {contact.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <section className="py-16 px-6 md:px-16 border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            data-animate
            className="inline-flex items-center gap-3 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors font-mono text-sm group"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
            <span>返回首页</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
