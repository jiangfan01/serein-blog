import { Footer, Layout, Navbar } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

export default async function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap("/notes");

  return (
    <Layout
      docsRepositoryBase="https://github.com/jiangfan01/serein-blog/tree/main/src/content"
      footer={<Footer>Notes, architecture docs, and interview prep.</Footer>}
      navbar={<Navbar logo={<b>Serein Notes</b>} />}
      pageMap={pageMap}
      sidebar={{ defaultMenuCollapseLevel: 1 }}
      toc={{ backToTop: "Back to top", title: "On this page" }}
    >
      {children}
    </Layout>
  );
}
