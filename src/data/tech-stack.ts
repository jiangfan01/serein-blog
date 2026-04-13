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
  { name: "React Bits", url: "https://react-bits.dev", category: "UI 库" },
  { name: "Tailwind CSS", url: "https://tailwindcss.com", category: "UI 库" },
  
  // 动画
  { name: "GSAP", url: "https://gsap.com", category: "动画" },
  { name: "Framer Motion", url: "https://www.framer.com/motion", category: "动画" },
  
  // 可视化
  { name: "AntV", url: "https://antv.antgroup.com", category: "可视化" },
  
  // 状态管理
  { name: "Zustand", url: "https://zustand-demo.pmnd.rs", category: "状态管理" },
  { name: "TanStack Query", url: "https://tanstack.com/query", category: "状态管理" },
  
  // 后端框架
  { name: "Node.js", url: "https://nodejs.org", category: "后端框架" },
  { name: "Express", url: "https://expressjs.com", category: "后端框架" },
  { name: "Golang", url: "https://go.dev", category: "后端框架" },
  { name: "Gin", url: "https://gin-gonic.com", category: "后端框架" },
  
  // 数据库 & ORM
  { name: "MySQL", url: "https://www.mysql.com", category: "数据库 & ORM" },
  { name: "PostgreSQL", url: "https://www.postgresql.org", category: "数据库 & ORM" },
  { name: "Prisma", url: "https://www.prisma.io", category: "数据库 & ORM" },
  { name: "Sequelize", url: "https://sequelize.org", category: "数据库 & ORM" },
  
  // AI 工具
  { name: "Claude", url: "https://claude.ai", category: "AI 工具" },
  { name: "Claude Code", url: "https://claude.ai", category: "AI 工具" },
  { name: "Codex", url: "https://openai.com/blog/openai-codex", category: "AI 工具" },
  { name: "Gemini", url: "https://gemini.google.com", category: "AI 工具" },
  { name: "Google AI Studio", url: "https://aistudio.google.com", category: "AI 工具" },
  { name: "Kiro", url: "https://kiro.ai", category: "AI 工具" },
  
  // 实时通信
  { name: "WebSocket", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSocket", category: "实时通信" },
  { name: "Streaming", url: "https://developer.mozilla.org/en-US/docs/Web/API/Streams_API", category: "实时通信" },
];

export const categories = Array.from(new Set(techStack.map(item => item.category)));
