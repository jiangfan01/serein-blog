"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Check, Copy } from "lucide-react";
import { gsap } from "gsap";
import avatarImage from "@/assets/images/avatar.jpg";
import githubIcon from "@/assets/images/svg/github-fill.svg";
import wechatIcon from "@/assets/images/svg/wechat-fill.svg";
import qqIcon from "@/assets/images/svg/QQ.svg";
import qrcodeImage from "@/assets/images/qrcode.jpg";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const contactInfo = [
  {
    icon: Mail,
    iconType: "lucide" as const,
    label: "邮箱",
    value: "jf1431037397@gmail.com",
    href: "mailto:jf1431037397@gmail.com",
    display: "jf1431037397@gmail.com"
  },
  {
    iconSvg: githubIcon,
    iconType: "svg" as const,
    label: "GitHub",
    value: "jiangfan01",
    href: "https://github.com/jiangfan01",
    display: "github.com/jiangfan01"
  },
  {
    iconSvg: wechatIcon,
    iconType: "svg" as const,
    label: "微信",
    value: "Devoted-serein",
    href: null,
    display: "Devoted-serein"
  },
  {
    iconSvg: qqIcon,
    iconType: "svg" as const,
    label: "QQ",
    value: "1431037397",
    href: null,
    display: "1431037397"
  }
];

function CopyableContact({ contact }: { contact: typeof contactInfo[number] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contact.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iconElement = contact.iconType === "lucide" && contact.icon ? (
    <contact.icon className="w-5 h-5 text-[var(--accent)]" />
  ) : contact.iconType === "svg" && contact.iconSvg ? (
    <Image
      src={contact.iconSvg}
      alt={contact.label}
      width={20}
      height={20}
      className="text-[var(--accent)]"
      style={{ filter: 'brightness(0) saturate(100%) invert(64%) sepia(35%) saturate(456%) hue-rotate(122deg) brightness(91%) contrast(87%)' }}
    />
  ) : null;

  const inner = (
    <div className="group flex items-start gap-4 p-6 hover:bg-[var(--surface-secondary)]/50 transition-colors rounded-lg cursor-pointer">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center group-hover:bg-[var(--accent)]/20 transition-colors">
        {iconElement}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
          {contact.label}
        </div>
        <div className="text-[var(--text-strong)] font-medium break-all group-hover:text-[var(--accent)] transition-colors flex items-center gap-2">
          {contact.display}
          {contact.label !== "微信" && (
            <span className="opacity-0 group-hover:opacity-60 transition-opacity">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // 微信：hover 显示二维码
  if (contact.label === "微信") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={handleCopy}>{inner}</div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-white p-2 rounded-xl shadow-2xl border border-gray-100"
        >
          <Image
            src={qrcodeImage}
            alt="微信二维码"
            width={180}
            height={320}
            className="rounded-lg object-cover"
            style={{ aspectRatio: "9/16" }}
          />
        </TooltipContent>
      </Tooltip>
    );
  }

  // 有链接的：点击跳转 + 复制 tooltip
  if (contact.href) {
    return (
      <Tooltip open={copied || undefined}>
        <TooltipTrigger asChild>
          <a
            href={contact.href}
            target={contact.href.startsWith('http') ? '_blank' : undefined}
            rel={contact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            onClick={(e) => {
              e.preventDefault();
              handleCopy();
              window.open(contact.href!, contact.href!.startsWith('http') ? '_blank' : '_self');
            }}
          >
            {inner}
          </a>
        </TooltipTrigger>
        {copied && (
          <TooltipContent side="top">
            <Check className="w-3 h-3" /> 已复制
          </TooltipContent>
        )}
      </Tooltip>
    );
  }

  // 无链接的（QQ 等）：点击复制
  return (
    <Tooltip open={copied || undefined}>
      <TooltipTrigger asChild>
        <div onClick={handleCopy}>{inner}</div>
      </TooltipTrigger>
      {copied && (
        <TooltipContent side="top">
          <Check className="w-3 h-3" /> 已复制
        </TooltipContent>
      )}
    </Tooltip>
  );
}

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const bioRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 初始状态
      gsap.set([avatarRef.current, titleRef.current, subtitleRef.current, metaRef.current], {
        opacity: 0,
        y: 30,
      });
      gsap.set([bioRef.current, contactRef.current, skillsRef.current, backRef.current], {
        opacity: 0,
        y: 40,
      });

      // 动画序列
      tl.to(avatarRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.2)
        .to(titleRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.4)
        .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.5 }, 0.5)
        .to(metaRef.current, { opacity: 1, y: 0, duration: 0.5 }, 0.6)
        .to(bioRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.7)
        .to(contactRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.9)
        .to(skillsRef.current, { opacity: 1, y: 0, duration: 0.6 }, 1.1)
        .to(backRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.3);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--app-bg)] pt-32 pb-24 px-6 md:px-16">
      <div className="max-w-4xl mx-auto">
        {/* 头像区域 */}
        <div className="flex flex-col items-center mb-16">
          <div ref={avatarRef} className="relative w-40 h-40 mb-8">
            <Image
              src={avatarImage}
              alt="Serein"
              fill
              className="rounded-full object-cover"
              priority
            />
            <div className="absolute inset-0 rounded-full ring-2 ring-[var(--accent)]/20" />
          </div>

          <h1 ref={titleRef} className="text-5xl md:text-6xl font-black text-[var(--text-strong)] mb-4 tracking-tight">
            Serein
          </h1>
          
          <p ref={subtitleRef} className="text-xl text-[var(--text-secondary)] mb-2">
            前端开发工程师
          </p>
          
          <div ref={metaRef} className="flex items-center gap-2 text-[var(--text-tertiary)] text-sm font-mono">
            <span>男</span>
            <span>·</span>
            <span>24岁</span>
            <span>·</span>
            <span>杭州</span>
          </div>
        </div>

        {/* 简介 */}
        <div ref={bioRef} className="mb-20">
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed text-center max-w-2xl mx-auto">
            热衷于探索前沿技术与视觉美学的全栈开发者。
            <br />
            追逐新鲜热门的技术栈，痴迷于打造极致的用户体验。
            <br />
            从前端的精雕细琢到后端的架构探索，永远保持好奇心与上进心。
          </p>
        </div>

        {/* 联系方式 */}
        <div ref={contactRef} className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-8 text-center">
            联系方式
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactInfo.map((contact) => (
              <CopyableContact key={contact.label} contact={contact} />
            ))}
          </div>
        </div>

        {/* 技能标签 */}
        <div ref={skillsRef} className="border-t border-[var(--border-subtle)] pt-16">
          <h2 className="text-2xl font-bold text-[var(--text-strong)] mb-8 text-center">
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
                className="px-4 py-2 text-sm font-mono text-[var(--text-secondary)] border border-[var(--border-default)] rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* 返回首页 */}
        <div ref={backRef} className="mt-20 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors text-sm font-mono"
          >
            <span>←</span>
            <span>返回首页</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
