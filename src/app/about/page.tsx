"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Code2, MessageCircle, Hash } from "lucide-react";
import avatarImage from "@/assets/images/avatar.jpg";

const contactInfo = [
  {
    icon: Mail,
    label: "邮箱",
    value: "jf1431037397@gmail.com",
    href: "mailto:jf1431037397@gmail.com",
    display: "jf1431037397@gmail.com"
  },
  {
    icon: Code2,
    label: "GitHub",
    value: "jiangfan01",
    href: "https://github.com/jiangfan01",
    display: "github.com/jiangfan01"
  },
  {
    icon: MessageCircle,
    label: "微信",
    value: "Devoted-serein",
    href: null,
    display: "Devoted-serein"
  },
  {
    icon: Hash,
    label: "QQ",
    value: "1431037397",
    href: null,
    display: "1431037397"
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-32 pb-24 px-6 md:px-16">
      <div className="max-w-4xl mx-auto">
        {/* 头像区域 */}
        <div className="flex flex-col items-center mb-16">
          <div className="relative w-40 h-40 mb-8">
            <Image
              src={avatarImage}
              alt="Serein"
              fill
              className="rounded-full object-cover"
              priority
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-[var(--accent)]/20" />
          </div>

          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Serein
          </h1>
          
          <p className="text-xl text-gray-400 mb-2">
            前端开发工程师
          </p>
          
          <div className="flex items-center gap-2 text-gray-500 text-sm font-mono">
            <span>男</span>
            <span>·</span>
            <span>24岁</span>
            <span>·</span>
            <span>杭州</span>
          </div>
        </div>

        {/* 简介 */}
        <div className="mb-20">
          <p className="text-gray-400 text-lg leading-relaxed text-center max-w-2xl mx-auto">
            热衷于探索前沿技术与视觉美学的全栈开发者。
            <br />
            追逐新鲜热门的技术栈，痴迷于打造极致的用户体验。
            <br />
            从前端的精雕细琢到后端的架构探索，永远保持好奇心与上进心。
          </p>
        </div>

        {/* 联系方式 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            联系方式
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((contact) => {
              const Icon = contact.icon;
              const content = (
                <div className="group flex items-start gap-4 p-6 hover:bg-white/[0.02] transition-colors rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
                    <Icon className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-gray-600 uppercase tracking-wider mb-1">
                      {contact.label}
                    </div>
                    <div className="text-white font-medium break-all group-hover:text-[var(--accent)] transition-colors">
                      {contact.display}
                    </div>
                  </div>
                </div>
              );

              if (contact.href) {
                return (
                  <a
                    key={contact.label}
                    href={contact.href}
                    target={contact.href.startsWith('http') ? '_blank' : undefined}
                    rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div key={contact.label}>
                  {content}
                </div>
              );
            })}
          </div>
        </div>

        {/* 技能标签 */}
        <div className="border-t border-white/10 pt-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            技能方向
          </h2>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              'React', 'Vue', 'Next.js', 'TypeScript',
              'Node.js', 'Golang', 'Gin',
              'AI 应用', 'Agent', 'LLM 集成',
              'Prisma', 'MySQL', 'PostgreSQL',
              'GSAP', 'Framer Motion', 'Tailwind CSS'
            ].map(skill => (
              <span
                key={skill}
                className="px-4 py-2 text-sm font-mono text-gray-400 border border-gray-800 rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 返回首页 */}
        <div className="mt-20 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[var(--accent)] transition-colors text-sm font-mono"
          >
            <span>←</span>
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
