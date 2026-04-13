export interface TechItem {
  name: string;
  url: string;
  category: string;
  icon?: string;
}

export const techStack: TechItem[] = [
  // 前端框架
  { name: "React", url: "https://react.dev", category: "前端框架" },
  { name: "Vue", url: "https://vuejs.org", category: "前端框架" },
  { name: "Next.js", url: "https://nextjs.org", category: "前端框架" },
  
  // UI 库
  { name: "Ant Design", url: "https://ant.design", category: "UI 库" },
  { name: "Magic UI", url: "https://magicui.design", category: "UI 库" },
  { name: "Tailwind CSS", url: "https://tailwindcss.com", category: "UI 库" },
  
  // 动画
  { name: "GSAP", url: "https://gsap.com", category: "动画" },
  { name: "Framer Motion", url: "https://www.framer.com/motion", category: "动画" },
  
  // 可视化
  { name: "AntV", url: "https://antv.antgroup.com", category: "可视化" },
  
  // 状态管理
  { name: "Zustand", url: "https://zustand-demo.pmnd.rs", category: "状态管理" },
  { name: "TanStack Query", url: "https://tanstack.com/query", category: "状态管理" },
  
  // 后端
  { name: "Node.js", url: "https://nodejs.org", category: "后端" },
  { name: "Express", url: "https://expressjs.com", category: "后端" },
  { name: "Golang", url: "https://go.dev", category: "后端" },
  
  // 数据库
  { name: "MySQL", url: "https://www.mysql.com", category: "数据库" },
  { name: "PostgreSQL", url: "https://www.postgresql.org", category: "数据库" },
  { name: "Prisma", url: "https://www.prisma.io", category: "数据库" },
  
  // AI
  { name: "AI/LLM", url: "https://openai.com", category: "AI" },
  { name: "Agent", url: "https://www.langchain.com", category: "AI" },
  
  // 其他
  { name: "TypeScript", url: "https://www.typescriptlang.org", category: "语言" },
  { name: "WebSocket", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket", category: "实时通信" },
  { name: "Streaming", url: "https://developer.mozilla.org/en-US/docs/Web/API/Streams_API", category: "实时通信" },
];

export const categories = Array.from(new Set(techStack.map(item => item.category)));
