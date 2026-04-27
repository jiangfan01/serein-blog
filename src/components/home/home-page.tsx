"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
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
    description: "重构 SSE 架构，负责多会话状态、工作流画布、多维表格和富文本编辑等核心模块。",
    href: "https://100.city/cityChat",
    tags: ["React", "SSE", "React Flow", "Zustand"],
  },
  {
    id: "GEO",
    type: "全栈平台",
    title: "贴牌代理站与多库数据隔离",
    description: "参与 0 到 1 建设，完成主站与子站双模式运行、后台配置和多实例数据隔离。",
    tags: ["React", "Golang", "Gin", "MySQL"],
  },
  {
    id: "QIEZ AI",
    type: "AI 工作流",
    title: "从文案到多媒体的生成链路",
    description: "基于 React Flow 编排多模型能力，串联对话、图片、视频和数字人能力。",
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
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <main>
        <HeroSection />
        <FocusSection />
        <NotesSection />
        <ProjectsSection />
        <StackSection />
        <ClosingSection />
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border-subtle)] px-5 pb-16 pt-28 sm:px-8 md:px-12 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-end">
        <div className="home-reveal">
          <p className="mb-8 font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
            Serein / AI Engineering Notebook
          </p>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-[var(--text-strong)] sm:text-6xl lg:text-7xl">
            把 AI 应用开发里的混乱，整理成可以复用的工程笔记。
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
            这里记录 Agent、RAG、SSE、前端架构和全栈产品实践。不是资料仓库，而是一套持续进化的个人工程工作台。
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/notes"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-contrast)] transition-transform hover:-translate-y-0.5"
            >
              阅读笔记
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-5 py-3 text-sm font-medium text-[var(--text-strong)] transition-colors hover:border-[var(--text-strong)]"
            >
              打开 AI Chat
              <Bot className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="home-reveal home-reveal-delay-1 border-l border-[var(--border-default)] pl-6 lg:pl-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Current Operating System
            </span>
          </div>
          <div className="space-y-5">
            {principles.map((item, index) => (
              <div
                key={item}
                className="grid grid-cols-[42px_1fr] items-baseline border-b border-[var(--border-subtle)] pb-5 last:border-b-0"
              >
                <span className="font-mono text-xs text-[var(--text-quaternary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-lg font-medium text-[var(--text-strong)]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FocusSection() {
  return (
    <section className="px-5 py-16 sm:px-8 md:px-12 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="/ 当前关注"
          title="不是泛泛地学技术，而是围绕真实产品问题沉淀方法。"
          description="首页先承担导航职责：告诉访问者我在研究什么、写了什么、做过什么。"
        />

        <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-2">
          {focusAreas.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="home-reveal group bg-[var(--surface)] p-6 transition-colors hover:bg-[var(--surface-secondary)]"
                style={{ animationDelay: `${120 + index * 70}ms` }}
              >
                <div className="mb-10 flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-quaternary)]">
                    {item.id}
                  </span>
                  <Icon className="h-5 w-5 text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--accent)]" />
                </div>
                <h3 className="text-2xl font-semibold text-[var(--text-strong)]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NotesSection() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-16 sm:px-8 md:px-12 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_1fr]">
          <SectionHeader
            eyebrow="/ 笔记索引"
            title="以主题聚合，而不是按日期堆文章。"
            description="技术笔记的价值在于能被再次调用。这里更像一个工程知识图谱，而不是流水账。"
          />

          <div className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)]">
            {noteTracks.map((track, index) => (
              <Link
                key={track.title}
                href={track.href}
                className="group grid gap-4 py-6 transition-colors hover:bg-[var(--surface-secondary)]/50 sm:grid-cols-[44px_1fr_auto]"
              >
                <span className="font-mono text-xs text-[var(--text-quaternary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-xl font-medium text-[var(--text-strong)]">
                    {track.title}
                  </span>
                  <span className="mt-2 block text-sm text-[var(--text-secondary)]">
                    {track.meta}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection() {
  return (
    <section className="px-5 py-16 sm:px-8 md:px-12 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="/ 项目复盘"
          title="项目不是作品展示，而是系统能力的证据。"
          description="保留少量项目，把重点放在我负责的复杂度和解决的问题上。"
        />

        <div className="mt-12 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
          {projects.map((project) => (
            <article
              key={project.id}
              className="grid gap-8 py-10 lg:grid-cols-[180px_1fr]"
            >
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-quaternary)]">
                  {project.id}
                </p>
                <p className="mt-3 text-sm text-[var(--accent)]">
                  {project.type}
                </p>
              </div>
              <div className="max-w-4xl">
                <h3 className="text-3xl font-semibold text-[var(--text-strong)]">
                  {project.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-[var(--text-secondary)]">
                  {project.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--border-default)] px-3 py-1 font-mono text-[11px] text-[var(--text-tertiary)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {project.href && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-strong)] hover:text-[var(--accent)]"
                  >
                    查看项目
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StackSection() {
  return (
    <section className="border-y border-[var(--border-subtle)] bg-[var(--surface)] px-5 py-16 sm:px-8 md:px-12 lg:px-16 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="/ 技术栈"
          title="工具选型服务于交付速度，也服务于长期维护。"
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {stackGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className="border-t border-[var(--border-default)] pt-6">
                <div className="mb-8 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-lg font-semibold text-[var(--text-strong)]">
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
                      className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {item.name}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="px-5 py-20 sm:px-8 md:px-12 lg:px-16 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
            / Next
          </p>
          <h2 className="max-w-3xl text-4xl font-semibold leading-tight text-[var(--text-strong)] sm:text-5xl">
            下一步会把 AI Chat、笔记系统和项目复盘继续收敛成一套工作台体验。
          </h2>
        </div>
        <Link
          href="/about"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-default)] px-5 py-3 text-sm font-medium text-[var(--text-strong)] transition-colors hover:border-[var(--text-strong)]"
        >
          关于我
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold leading-tight text-[var(--text-strong)] sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
