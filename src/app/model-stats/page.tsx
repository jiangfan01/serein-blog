/**
 * 模型统计页面
 *
 * 展示模型使用情况、成本、延迟等统计数据
 */
import { Metadata } from "next";
import { ModelStatsClient } from "./client";

export const metadata: Metadata = {
  title: "Model Stats",
  description: "AI 模型使用统计",
};

export default function ModelStatsPage() {
  return <ModelStatsClient />;
}
