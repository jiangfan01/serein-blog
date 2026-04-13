import nextra from "nextra";
import type { NextConfig } from "next";

const withNextra = nextra({
  contentDirBasePath: "/notes",
});

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./src/mdx-components.tsx",
    },
  },
};

export default withNextra(nextConfig);
