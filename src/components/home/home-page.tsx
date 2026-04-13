"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IntroAnimation } from "@/components/intro/intro-animation-final";
import { techStack } from "@/data/tech-stack";
import { LineWaves } from "@/components/effects/line-waves";
import GradualBlur from "@/components/effects/gradual-blur";

const projects = [
  {
    id: "01",
    title: "100 CITY",
    description: "聚焦营销领域的智能工作平台，支持通过自然语言完成营销内容生产、对话协作与工作流编排。主导 SSE 架构重构，实现多会话流式响应与跨页面状态衔接；负责工作流画布、多维表格、富文本编辑等核心能力建设。",
    tags: ["React", "SSE", "React Flow", "Zustand"],
    category: "AI 工作平台",
    url: "https://100.city/cityChat",
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    id: "02",
    title: "极义 GEO",
    description: "面向 GEO 场景的业务平台，覆盖官网展示、后台配置、代理站交付能力。作为全栈开发参与 0 到 1 建设，独立完成贴牌/代理站能力，支持主站与子站双模式运行，实现多库实例接入与数据隔离。",
    tags: ["React", "Golang", "Gin", "MySQL"],
    category: "全栈平台",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: "03",
    title: "实时热点聚合平台",
    description: "面向内容创作的实时热点聚合平台，聚合多平台热门数据，结合 Agent 能力分析热点匹配情况，输出多角度分析及口播稿内容。独立完成前后端开发，设计提示词与生成逻辑编排。",
    tags: ["React", "Golang", "Agent", "内容生成"],
    category: "AI 内容平台",
    gradient: "from-orange-500 to-red-500"
  },
  {
    id: "04",
    title: "茄子 AI",
    description: "多模型 AI 工作流平台，支持画布式编排串联对话、图片、视频及数字人能力。基于 React Flow 实现工作流画布，接入 GPT、Gemini、图片模型、视频模型等多类生成能力，完成从文案到多媒体内容的完整链路。",
    tags: ["Next.js 16", "PostgreSQL", "Prisma", "React Flow"],
    category: "AI 工作流",
    gradient: "from-green-500 to-teal-500"
  },
];

export function HomePage() {
  return (
    <>
      <IntroAnimation />
      
      <div className="relative bg-[var(--app-bg)]">
        {/* LineWaves Background */}
        <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
          <LineWaves
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
        </div>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 md:px-16 overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col items-center text-center">
              <span className="font-mono text-[var(--accent)] tracking-[0.4em] uppercase text-xs mb-8 block">
                全栈开发 · AI 架构师
              </span>
              
              <h1 className="text-[clamp(3rem,10vw,8rem)] font-black tracking-tighter text-white leading-[0.95] mb-12">
                让我们一起
                <br />
                <span className="text-[var(--accent)] italic" style={{
                  textShadow: '0 0 30px rgba(47, 155, 146, 0.3)'
                }}>
                  创造些什么
                </span>
              </h1>

              <div className="max-w-2xl text-gray-400 text-lg md:text-xl leading-relaxed mb-12">
                融合技术精度与创意灵魂。构建可扩展的数字生态系统，让性能与高端编辑美学完美结合。
              </div>

              <div className="flex flex-wrap gap-8 justify-center items-center">
                <Link
                  href="/projects"
                  className="group inline-flex items-center gap-3 text-white hover:text-[var(--accent)] transition-colors text-lg font-bold"
                >
                  <span>开始项目</span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </Link>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors text-lg font-bold border-b-2 border-gray-600 hover:border-white pb-1"
                >
                  查看归档
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Glows */}
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[var(--accent)]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-[150px] pointer-events-none" />
        </section>

        {/* Tech Stack Section - Architectural List Layout */}
        <section className="py-40 px-6 md:px-16 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-32 gap-12">
              <div className="max-w-2xl">
                <div className="font-mono text-[var(--accent)] tracking-[0.4em] text-xs mb-6 uppercase">
                  / 技术能力
                </div>
                <h2 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]">
                  架构
                  <br />
                  <span className="text-[var(--accent)]" style={{ textShadow: '0 0 30px rgba(47, 155, 146, 0.3)' }}>
                    技术栈
                  </span>
                </h2>
              </div>
              <div className="max-w-md lg:mt-24">
                <p className="text-gray-400 text-lg leading-relaxed border-l-2 border-[var(--accent)]/30 pl-8">
                  精选工业级技术，以其性能、可扩展性和开发体验而选择。
                </p>
              </div>
            </div>

            {/* Architectural List */}
            <div className="border-t border-white/20">
              {/* Group 01: Frontend */}
              <div className="group grid grid-cols-1 md:grid-cols-12 py-16 border-b border-white/20 items-start hover:bg-white/[0.02] transition-colors">
                <div className="md:col-span-1 font-mono text-gray-600 text-sm tracking-widest group-hover:text-[var(--accent)] transition-colors">
                  01
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-4 md:mb-0">
                    前端
                    <br />
                    工程
                  </h3>
                </div>
                <div className="md:col-span-8">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    {techStack
                      .filter(t => ['前端框架', 'UI 库', '动画'].includes(t.category))
                      .map(tech => (
                        <a
                          key={tech.name}
                          href={tech.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col gap-2 group/item"
                        >
                          <span className="text-white font-bold text-lg group-hover/item:text-[var(--accent)] transition-colors flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full group-hover/item:shadow-[0_0_15px_rgba(47,155,146,0.8)] transition-all" />
                            {tech.name}
                          </span>
                          <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                            {tech.category}
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              {/* Group 02: AI */}
              <div className="group grid grid-cols-1 md:grid-cols-12 py-16 border-b border-white/20 items-start hover:bg-white/[0.02] transition-colors">
                <div className="md:col-span-1 font-mono text-gray-600 text-sm tracking-widest group-hover:text-[var(--accent)] transition-colors">
                  02
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-4 md:mb-0">
                    AI
                    <br />
                    集成
                  </h3>
                </div>
                <div className="md:col-span-8">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    {techStack
                      .filter(t => t.category === 'AI 工具')
                      .map(tech => (
                        <a
                          key={tech.name}
                          href={tech.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col gap-2 group/item"
                        >
                          <span className="text-white font-bold text-lg group-hover/item:text-[var(--accent)] transition-colors flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full group-hover/item:shadow-[0_0_15px_rgba(47,155,146,0.8)] transition-all" />
                            {tech.name}
                          </span>
                          <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                            LLM / Agent
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              {/* Group 03: Backend */}
              <div className="group grid grid-cols-1 md:grid-cols-12 py-16 border-b border-white/20 items-start hover:bg-white/[0.02] transition-colors">
                <div className="md:col-span-1 font-mono text-gray-600 text-sm tracking-widest group-hover:text-[var(--accent)] transition-colors">
                  03
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-4 md:mb-0">
                    后端 &
                    <br />
                    基础设施
                  </h3>
                </div>
                <div className="md:col-span-8">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    {techStack
                      .filter(t => ['后端框架', '数据库 & ORM'].includes(t.category))
                      .map(tech => (
                        <a
                          key={tech.name}
                          href={tech.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col gap-2 group/item"
                        >
                          <span className="text-white font-bold text-lg group-hover/item:text-[var(--accent)] transition-colors flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full group-hover/item:shadow-[0_0_15px_rgba(47,155,146,0.8)] transition-all" />
                            {tech.name}
                          </span>
                          <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                            {tech.category}
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              {/* Group 04: State & Tools */}
              <div className="group grid grid-cols-1 md:grid-cols-12 py-16 border-b border-white/20 items-start hover:bg-white/[0.02] transition-colors">
                <div className="md:col-span-1 font-mono text-gray-600 text-sm tracking-widest group-hover:text-[var(--accent)] transition-colors">
                  04
                </div>
                <div className="md:col-span-3">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-4 md:mb-0">
                    状态管理
                    <br />
                    & 工具
                  </h3>
                </div>
                <div className="md:col-span-8">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    {techStack
                      .filter(t => ['状态管理', '可视化', '实时通信', '语言'].includes(t.category))
                      .map(tech => (
                        <a
                          key={tech.name}
                          href={tech.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col gap-2 group/item"
                        >
                          <span className="text-white font-bold text-lg group-hover/item:text-[var(--accent)] transition-colors flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full group-hover/item:shadow-[0_0_15px_rgba(47,155,146,0.8)] transition-all" />
                            {tech.name}
                          </span>
                          <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                            {tech.category}
                          </span>
                        </a>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="py-32 px-6 md:px-16 overflow-hidden relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-24">
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bold text-white tracking-tight leading-none">
                我的
                <br />
                <span className="text-[var(--accent)] italic">项目</span>
              </h2>
            </div>

            <div className="space-y-0">
              {projects.map((project, index) => (
                <div
                  key={project.id}
                  className="group relative"
                  style={{
                    minHeight: '600px',
                    overflow: 'hidden',
                    background: 'linear-gradient(to bottom, rgba(47, 155, 146, 0.03), rgba(47, 155, 146, 0.01))'
                  }}
                >
                  {/* 内容区域 */}
                  <div 
                    className="relative z-10 py-32 px-4"
                    style={{
                      paddingBottom: '200px'
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                      {/* 左侧：编号和分类 */}
                      <div className="md:col-span-2">
                        <div className="flex flex-col gap-4">
                          <span className="text-6xl font-black text-white/10 group-hover:text-[var(--accent)]/20 transition-colors">
                            {project.id}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600">
                            {project.category}
                          </span>
                        </div>
                      </div>

                      {/* 右侧：内容 */}
                      <div className="md:col-span-10 space-y-6">
                        <h3 className="text-4xl md:text-5xl font-bold text-white group-hover:text-[var(--accent)] transition-colors">
                          {project.title}
                        </h3>

                        <p className="text-gray-400 text-lg leading-relaxed max-w-4xl">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap gap-3 pt-4">
                          {project.tags.map(tag => (
                            <span
                              key={tag}
                              className="font-mono text-xs text-gray-500 px-3 py-1 border border-gray-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {project.url ? (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 text-white hover:text-[var(--accent)] transition-colors group/link text-lg font-bold pt-8"
                          >
                            <span>查看项目</span>
                            <ArrowRight className="h-5 w-5 transform group-hover/link:translate-x-2 transition-transform" />
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-3 text-gray-600 text-lg font-bold pt-8">
                            <span>内部项目</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GradualBlur 效果 - 交错方向 */}
                  <GradualBlur
                    target="parent"
                    position={index % 2 === 0 ? "bottom" : "top"}
                    height="15rem"
                    strength={5}
                    divCount={12}
                    curve="bezier"
                    exponential
                    opacity={1}
                  />

                  {/* 分隔线 */}
                  {index < projects.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10 z-20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-48 px-6 md:px-16 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[clamp(3rem,8vw,6rem)] font-black text-white mb-12 tracking-tighter">
              准备好{' '}
              <span className="text-[var(--accent)] italic">开始</span>
              了吗？
            </h2>
            
            <p className="text-gray-400 text-xl mb-16 max-w-2xl mx-auto">
              接受精选合作伙伴关系和架构咨询。让我们创造一些有意义的东西。
            </p>

            <a
              href="mailto:hello@serein.dev"
              className="inline-flex items-center gap-3 text-white hover:text-[var(--accent)] transition-colors text-2xl font-black group"
            >
              <span>联系我</span>
              <ArrowRight className="h-6 w-6 transform group-hover:translate-x-2 transition-transform" />
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
