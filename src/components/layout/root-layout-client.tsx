"use client";

import { StaggeredMenu } from "@/components/navigation/staggered-menu";
import { SiteFooter } from "@/components/site/site-footer";

const menuItems = [
  { label: '首页', ariaLabel: '返回首页', link: '/' },
  { label: '项目', ariaLabel: '查看项目', link: '/projects' },
  { label: '笔记', ariaLabel: '阅读笔记', link: '/notes' },
  { label: '关于', ariaLabel: '了解我', link: '/about' }
];

const socialItems = [
  { label: 'GitHub', link: 'https://github.com' },
  { label: '推特', link: 'https://twitter.com' },
  { label: '领英', link: 'https://linkedin.com' }
];

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaggeredMenu
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="var(--app-fg)"
        openMenuButtonColor="#000"
        changeMenuColorOnOpen={true}
        colors={['var(--accent-soft)', 'var(--accent)']}
        accentColor="var(--accent)"
        isFixed={true}
        closeOnClickAway={true}
      />
      <div className="relative flex min-h-screen flex-col">
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
