import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import "./notes.css";

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap("/notes");

  return (
    <Layout
      docsRepositoryBase="https://github.com/jiangfan01/serein-blog/tree/main/src/content"
      footer={<Footer>笔记 · 技术沉淀 · 持续更新</Footer>}
      navbar={<Navbar logo={<b>Serein Blog</b>} />}
      pageMap={pageMap}
      sidebar={{ defaultMenuCollapseLevel: 1 }}
      toc={{ backToTop: "返回顶部", title: "本页目录" }}
    >
      {children}
    </Layout>
  );
}
