export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  url?: string;
}

export const projects: Project[] = [
  {
    id: "01",
    title: "100 CITY",
    description:
      "聚焦营销领域的智能工作平台，支持通过自然语言完成营销内容生产、对话协作与工作流编排。主导 SSE 架构重构，实现多会话流式响应与跨页面状态衔接；负责工作流画布、多维表格、富文本编辑等核心能力建设。",
    tags: ["React", "SSE", "React Flow", "Zustand"],
    category: "AI 工作平台",
    url: "https://100.city/cityChat",
  },
  {
    id: "02",
    title: "极义 GEO",
    description:
      "面向 GEO 场景的业务平台，覆盖官网展示、后台配置、代理站交付能力。作为全栈开发参与 0 到 1 建设，独立完成贴牌/代理站能力，支持主站与子站双模式运行，实现多库实例接入与数据隔离。",
    tags: ["React", "Golang", "Gin", "MySQL"],
    category: "全栈平台",
  },
  {
    id: "03",
    title: "实时热点聚合平台",
    description:
      "面向内容创作的实时热点聚合平台，聚合多平台热门数据，结合 Agent 能力分析热点匹配情况，输出多角度分析及口播稿内容。独立完成前后端开发，设计提示词与生成逻辑编排。",
    tags: ["React", "Golang", "Agent", "内容生成"],
    category: "AI 内容平台",
  },
  {
    id: "04",
    title: "茄子 AI",
    description:
      "多模型 AI 工作流平台，支持画布式编排串联对话、图片、视频及数字人能力。基于 React Flow 实现工作流画布，接入 GPT、Gemini、图片模型、视频模型等多类生成能力，完成从文案到多媒体内容的完整链路。",
    tags: ["Next.js 16", "PostgreSQL", "Prisma", "React Flow"],
    category: "AI 工作流",
  },
];
