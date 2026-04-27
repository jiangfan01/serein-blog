"use client";

import { useEffect, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  ChevronRight,
  Code2,
  Database,
  Layers3,
  Radio,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { techStack } from "@/data/tech-stack";

const focusAreas = [
  {
    id: "01",
    title: "Agent 编排",
    description: "ReAct 循环、工具调用、SSE 状态流、多轮观察与最终回答。",
    href: "/notes/agent",
    icon: Bot,
  },
  {
    id: "02",
    title: "前端架构",
    description: "组件边界、状态分层、渲染性能、复杂交互的工程化落地。",
    href: "/notes/react",
    icon: Layers3,
  },
  {
    id: "03",
    title: "实时体验",
    description: "ReadableStream、打字机、消息合并、长文本 Markdown 渲染。",
    href: "/notes/interview/long-text-rendering",
    icon: Radio,
  },
  {
    id: "04",
    title: "全栈实践",
    description: "Next.js、Prisma、数据库、部署、工具型产品的完整闭环。",
    href: "/projects",
    icon: Database,
  },
];

const noteTracks = [
  {
    title: "React / 渲染机制",
    meta: "Fiber、Hooks、状态管理、渲染优化",
    href: "/notes/react",
  },
  {
    title: "AI 应用开发",
    meta: "Agent、RAG、Workflow、工具调用",
    href: "/notes/agent",
  },
  {
    title: "面试与系统设计",
    meta: "SSE 架构、长文本、数据表格、工程复盘",
    href: "/notes/interview",
  },
  {
    title: "Web 基础",
    meta: "HTTP、缓存、浏览器、Node.js、算法",
    href: "/notes/web",
  },
];

const projects = [
  {
    id: "100CITY",
    type: "AI 工作平台",
    title: "多会话流式对话与工作流画布",
    description:
      "重构 SSE 架构，负责多会话状态、工作流画布、多维表格和富文本编辑等核心模块。",
    href: "https://100.city/cityChat",
    tags: ["React", "SSE", "React Flow", "Zustand"],
  },
  {
    id: "GEO",
    type: "全栈平台",
    title: "贴牌代理站与多库数据隔离",
    description:
      "参与 0 到 1 建设，完成主站与子站双模式运行、后台配置和多实例数据隔离。",
    tags: ["React", "Golang", "Gin", "MySQL"],
  },
  {
    id: "QIEZ AI",
    type: "AI 工作流",
    title: "从文案到多媒体的生成链路",
    description:
      "基于 React Flow 编排多模型能力，串联对话、图片、视频和数字人能力。",
    tags: ["Next.js", "Prisma", "PostgreSQL", "AI"],
  },
];

const principles = [
  "工具状态必须可见",
  "复杂交互先做分层",
  "UI 先统一 token",
  "笔记要服务复盘",
];

const stackGroups = [
  {
    title: "前端",
    icon: Code2,
    items: techStack.filter((item) =>
      ["前端框架", "UI 库", "动画"].includes(item.category)
    ),
  },
  {
    title: "AI",
    icon: Sparkles,
    items: techStack.filter((item) => item.category === "AI 工具"),
  },
  {
    title: "后端",
    icon: TerminalSquare,
    items: techStack.filter((item) =>
      ["后端框架", "数据库 & ORM"].includes(item.category)
    ),
  },
];

export function HomePage() {
  useHomeReveal();

  return (
    <div className="min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[linear-gradient(to_bottom,var(--surface),transparent)] opacity-70" />
      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-32 pt-24 sm:px-10 lg:px-16">
        <div className="space-y-32">
          <HeroSection />
          <FocusSection />
          <NotesSection />
          <ProjectsSection />
          <StackSection />
          <ClosingSection />
        </div>
      </main>
    </div>
  );
}

function useHomeReveal() {
  useEffect(() => {
    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-home-reveal]")
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("home-reveal-in");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.16,
      }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);
}

function HeroSection() {
  return (
    <section
      className="home-scroll-reveal flex flex-col items-center pb-8 pt-10 text-center"
      data-home-reveal
    >
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-1.5 shadow-[var(--shadow-soft)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        <span className="text-[11px] font-medium uppercase tracking-normal text-[var(--text-secondary)]">
          Serein AI Engineering Notebook
        </span>
      </div>

      <h1 className="text-balance max-w-4xl text-4xl font-semibold leading-[1.08] tracking-normal text-[var(--text-strong)] sm:text-5xl lg:text-6xl">
        把 AI 开发的混乱，
        <br />
        整理成<span className="text-[var(--accent)]">可复用</span>的工程笔记。
      </h1>

      <p className="mt-8 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
        这里记录 Agent、RAG、SSE、前端架构和全栈产品实践。不是资料仓库，而是一套持续进化的个人工程工作台。
      </p>

      <div className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          href="/notes"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-medium text-[var(--accent-contrast)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto"
        >
          阅读笔记
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/chat"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface)] px-7 py-3.5 text-sm font-medium text-[var(--text-strong)] transition-colors duration-300 hover:border-[var(--text-strong)] sm:w-auto"
        >
          打开 Serein AI
          <Bot className="h-4 w-4 text-[var(--text-tertiary)]" />
        </Link>
      </div>

      <div className="mt-24 grid w-full grid-cols-2 gap-6 border-t border-[var(--border-subtle)] pt-10 text-left md:grid-cols-4">
        {principles.map((item, index) => (
          <div key={item} className="space-y-2">
            <span className="font-mono text-xs text-[var(--text-quaternary)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm font-medium leading-6 text-[var(--text-secondary)]">
              {item}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FocusSection() {
  return (
    <section className="home-scroll-reveal" data-home-reveal>
      <SectionHeader title="当前关注" subtitle="围绕真实产品问题沉淀方法" />

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {focusAreas.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="home-scroll-reveal group flex min-h-64 flex-col rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-default)] hover:shadow-[var(--shadow-md)]"
              data-home-reveal
              style={{ "--home-reveal-delay": `${index * 70}ms` } as CSSProperties}
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--app-bg)] transition-colors duration-300 group-hover:border-[var(--accent)]">
                  <Icon className="h-5 w-5 text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--accent)]" />
                </div>
                <span className="font-mono text-xs text-[var(--text-quaternary)]">
                  {item.id}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-strong)]">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                {item.description}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-8 text-sm font-medium text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--accent)]">
                继续阅读
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function NotesSection() {
  return (
    <section className="home-scroll-reveal" data-home-reveal>
      <SectionHeader title="笔记索引" subtitle="以主题聚合的工程知识图谱" />

      <div className="mt-12 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
        {noteTracks.map((track, index) => (
          <Link
            key={track.title}
            href={track.href}
            className="group grid gap-4 py-6 transition-colors duration-300 hover:border-[var(--text-strong)] sm:grid-cols-[48px_1fr_auto] sm:items-center"
          >
            <span className="font-mono text-sm text-[var(--text-quaternary)] transition-colors duration-300 group-hover:text-[var(--text-strong)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <span className="block text-lg font-medium text-[var(--text-strong)]">
                {track.title}
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--text-secondary)]">
                {track.meta}
              </span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] transition-colors duration-300 group-hover:bg-[var(--accent)]">
              <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-colors duration-300 group-hover:text-[var(--accent-contrast)]" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className="home-scroll-reveal" data-home-reveal>
      <SectionHeader
        title="项目复盘"
        subtitle="项目不是作品展示，而是系统能力的证据"
      />

      <div className="mt-12 space-y-14">
        {projects.map((project, index) => (
          <article
            key={project.id}
            className="home-scroll-reveal grid gap-5 border-t border-[var(--border-subtle)] pt-10 md:grid-cols-[180px_1fr]"
            data-home-reveal
            style={{ "--home-reveal-delay": `${index * 80}ms` } as CSSProperties}
          >
            <div className="space-y-2">
              <h3 className="font-mono text-sm font-semibold text-[var(--text-strong)]">
                {project.id}
              </h3>
              <p className="text-sm font-medium text-[var(--accent)]">
                {project.type}
              </p>
            </div>

            <div>
              <h4 className="text-2xl font-semibold leading-tight text-[var(--text-strong)] sm:text-3xl">
                {project.title}
              </h4>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
                {project.description}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
                  >
                    {tag}
                  </span>
                ))}
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-strong)] transition-colors duration-300 hover:text-[var(--accent)]"
                  >
                    查看案例
                    <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function StackSection() {
  return (
    <section className="home-scroll-reveal" data-home-reveal>
      <SectionHeader title="技术栈" subtitle="工具选型服务于交付速度与长期维护" />

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {stackGroups.map((group, index) => {
          const Icon = group.icon;

          return (
            <div
              key={group.title}
              className="home-scroll-reveal rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] p-6"
              data-home-reveal
              style={{ "--home-reveal-delay": `${index * 70}ms` } as CSSProperties}
            >
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--app-bg)]">
                  <Icon className="h-4 w-4 text-[var(--text-strong)]" />
                </div>
                <h3 className="text-base font-medium text-[var(--text-strong)]">
                  {group.title}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <a
                    key={`${group.title}-${item.name}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--app-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-300 hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section
      className="home-scroll-reveal border-t border-[var(--border-subtle)] pt-16 text-center"
      data-home-reveal
    >
      <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight text-[var(--text-strong)] sm:text-4xl">
        下一步会把 AI Chat、笔记系统和项目复盘收敛成一套完整的工作台体验。
      </h2>
      <Link
        href="/about"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-strong)] px-7 py-3.5 text-sm font-medium text-[var(--text-inverse)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        关于我
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-normal text-[var(--text-strong)] sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base leading-7 text-[var(--text-secondary)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
