"use client";

import { usePathname } from "next/navigation";
import { StaggeredMenu } from "@/components/navigation/staggered-menu";
import { SiteFooter } from "@/components/site/site-footer";

const menuItems = [
  { label: '首页', ariaLabel: '返回首页', link: '/' },
  // { label: '项目', ariaLabel: '查看项目', link: '/projects' },
  { label: '笔记', ariaLabel: '阅读笔记', link: '/notes' },
  { label: 'AI', ariaLabel: 'AI 对话', link: '/chat' },
  { label: '关于', ariaLabel: '了解我', link: '/about' }
];

const socialItems = [
  { label: 'GitHub', link: 'https://github.com' },
  { label: '推特', link: 'https://twitter.com' },
  { label: '领英', link: 'https://linkedin.com' }
];

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNotesPage = pathname?.startsWith('/notes');
  const isChatPage = pathname?.startsWith('/chat');

  // Notes 页面使用 Nextra 自己的布局，不需要我们的导航和 Footer
  if (isNotesPage) {
    return <>{children}</>;
  }

  // Chat 页面使用独立的全屏布局
  if (isChatPage) {
    return <>{children}</>;
  }

  return (
    <>
      <StaggeredMenu
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="var(--text-strong)"
        openMenuButtonColor="var(--text-strong)"
        changeMenuColorOnOpen={true}
        colors={['var(--surface-secondary)', 'var(--accent-soft)']}
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
