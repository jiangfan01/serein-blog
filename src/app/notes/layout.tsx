import { Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "./notes.css";

// 自定义 Logo 组件 - 不要用 Link，因为 Nextra navbar 已经包裹了一个 <a>
function NotesLogo() {
  return (
    <span className="flex items-center gap-2">
      <b style={{ color: '#f2f4f7', fontSize: '1.125rem' }}>Serein Blog</b>
    </span>
  );
}

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap("/notes");

  return (
    <Layout
      navbar={<Navbar logo={<NotesLogo />} />}
      pageMap={pageMap}
      sidebar={{ defaultMenuCollapseLevel: 1 }}
      toc={{ backToTop: "返回顶部", title: "本页目录" }}
      darkMode={true}
      editLink={null}
      feedback={{ content: null }}
    >
      {children}
    </Layout>
  );
}
