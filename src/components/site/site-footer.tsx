"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[var(--border-default)] bg-[var(--surface)]">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:px-10 md:py-20">
        {/* Main content */}
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand section */}
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-[var(--font-size-body)] leading-relaxed text-[var(--text-secondary)]">
              专注于 AI 工作流系统、流式用户体验和前端工程的作品集与笔记本
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              导航
            </h4>
            <ul className="space-y-3">
              {[
                { label: '首页', href: '/' },
                // { label: '项目', href: '/projects' },
                { label: '笔记', href: '/notes' },
                { label: '关于', href: '/about' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-1 text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
              社交
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'GitHub', href: 'https://github.com' },
                { label: '推特', href: 'https://twitter.com' },
                { label: '领英', href: 'https://linkedin.com' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-8 text-sm text-[var(--text-tertiary)] md:flex-row">
          <p>© {currentYear} Serein. 保留所有权利</p>
          <p className="text-[var(--text-quaternary)]">
            用心构建 · 持续迭代
          </p>
        </div>
      </div>
    </footer>
  );
}
