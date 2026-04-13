"use client";

import Link from "next/link";
import { useRef } from "react";
import { IntroAnimation } from "@/components/intro/intro-animation-final";
import { ArrowUpRight, Mail } from "lucide-react";
import { AnimatedButton } from "@/components/ui/animated-button";
import { TechStackSection } from "@/components/home/tech-stack-section";

const projects = [
  {
    id: "01",
    title: "SSE 多会话聊天系统",
    description: "流式架构与 React 生命周期分离，使用单例连接管理和缓冲渲染技术",
    tags: ["React", "SSE", "WebSocket"],
    year: "2024"
  },
  {
    id: "02",
    title: "AI 工作流编排器",
    description: "基于图的编排界面，支持阶段管理、分支逻辑、节点编辑和配置转换",
    tags: ["React Flow", "AI", "Workflow"],
    year: "2024"
  },
  {
    id: "03",
    title: "Agent 工具实验场",
    description: "用于提示词、工具调用、交互循环和面向产品的 AI 实验的实践空间",
    tags: ["LLM", "Agent", "Tools"],
    year: "2024"
  }
];

export function HomePage() {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <IntroAnimation />
      
      <div ref={contentRef} className="relative bg-[var(--app-bg)]">
        {/* Hero Section - Full Screen */}
        <section className="relative min-h-screen flex items-center justify-center px-6 md:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[var(--font-size-caption)] uppercase tracking-[0.32em] text-[var(--accent)]">
                  AI 前端工程师
                </p>
                <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text-strong)]">
                  构建流畅的
                  <br />
                  <span className="text-[var(--accent)]">AI 交互体验</span>
                </h1>
              </div>
              
              <p className="max-w-2xl text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-[var(--text-secondary)]">
                专注于 AI 工作流系统、流式用户体验和前端工程。
                <br />
                让复杂的系统变得简单易用。
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <AnimatedButton
                  href="/projects"
                  variant="slide"
                  slideDirection="left"
                  showIcon
                  primary
                >
                  查看项目
                </AnimatedButton>
                <AnimatedButton
                  href="/about"
                  variant="shine"
                >
                  关于我
                </AnimatedButton>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-sm text-[var(--text-tertiary)]">向下滚动</span>
            <div className="h-8 w-[1px] bg-gradient-to-b from-[var(--text-tertiary)] to-transparent" />
          </div>
        </section>

        {/* Skills Section - Split Layout with Category Menu */}
        <TechStackSection />

        {/* Projects Section - Full Screen Each */}
        <section className="relative border-t border-[var(--border-subtle)]">
          <div className="mx-auto w-full max-w-7xl px-6 md:px-10 py-32">
            <div className="mb-20">
              <p className="text-[var(--font-size-caption)] uppercase tracking-[0.32em] text-[var(--accent)] mb-6">
                精选作品
              </p>
              <h2 className="text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--text-strong)]">
                近期项目
              </h2>
            </div>

            <div className="space-y-32">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="group relative"
                >
                  <div className="flex flex-col md:flex-row gap-12 items-start">
                    {/* Project Number */}
                    <div className="text-[8rem] font-bold leading-none text-[var(--border-default)] group-hover:text-[var(--accent)] transition-colors">
                      {project.id}
                    </div>

                    {/* Project Info */}
                    <div className="flex-1 space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold text-[var(--text-strong)] group-hover:text-[var(--accent)] transition-colors">
                            {project.title}
                          </h3>
                          <span className="text-sm text-[var(--text-tertiary)]">
                            {project.year}
                          </span>
                        </div>
                        <p className="text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed text-[var(--text-secondary)]">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-primary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-2 text-[var(--accent)] font-medium hover:gap-4 transition-all"
                      >
                        查看详情
                        <ArrowUpRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>

                  {/* Divider */}
                  {index < projects.length - 1 && (
                    <div className="mt-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section - Full Screen */}
        <section className="relative min-h-screen flex items-center justify-center border-t border-[var(--border-subtle)] px-6 md:px-10">
          <div className="mx-auto w-full max-w-7xl text-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <p className="text-[var(--font-size-caption)] uppercase tracking-[0.32em] text-[var(--accent)]">
                  联系方式
                </p>
                <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--text-strong)]">
                  让我们一起
                  <br />
                  <span className="text-[var(--accent)]">创造些什么</span>
                </h2>
              </div>

              <p className="mx-auto max-w-2xl text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-[var(--text-secondary)]">
                对项目合作、技术交流或任何想法感兴趣？
                <br />
                随时联系我。
              </p>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-8">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-full border-2 border-[var(--border-strong)] px-8 py-4 text-base font-medium text-[var(--text-primary)] transition-all hover:scale-105 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-full border-2 border-[var(--border-strong)] px-8 py-4 text-base font-medium text-[var(--text-primary)] transition-all hover:scale-105 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Twitter
                </a>
                <a
                  href="mailto:your@email.com"
                  className="group flex items-center gap-3 rounded-full bg-[var(--accent)] px-8 py-4 text-base font-medium text-white transition-all hover:scale-105"
                >
                  <Mail className="h-5 w-5" />
                  发送邮件
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
