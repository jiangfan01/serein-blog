export interface TechGroup {
  num: string;
  title: string;
  categories: string[];
}

export const techGroups: TechGroup[] = [
  {
    num: "01",
    title: "前端工程",
    categories: ["前端框架", "UI 库", "动画"],
  },
  {
    num: "02",
    title: "AI 集成",
    categories: ["AI 工具"],
  },
  {
    num: "03",
    title: "后端 & 基础设施",
    categories: ["后端框架", "数据库 & ORM"],
  },
  {
    num: "04",
    title: "状态管理 & 工具",
    categories: ["状态管理", "可视化", "实时通信", "语言"],
  },
];
