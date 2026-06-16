/**
 * LangGraph L2：给图加一个"会调 LLM 的节点"
 *
 * L1 的节点是纯计算（+1、×2）。这一课的节点会真的调用 DeepSeek。
 * 你会发现：所谓"会说话的 Agent"，骨架和 L1 一模一样，只是节点内部换成了调模型。
 *
 * 运行：
 *   pnpm exec tsx src/lib/agent/learn/02-llm-node.ts
 * （会读 .env 里的 DEEPSEEK_API_KEY，真实联网调用）
 *
 * 对照 agent.ts：这就是你那个 agentNode 的最小版。
 */

import "dotenv/config";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  type BaseMessage,
  HumanMessage,
  AIMessage,
} from "@langchain/core/messages";

// ============================================================
// 1. State：这次只有一个 channel —— messages
// ============================================================
// reducer 用"追加"，所以每轮新消息都累积。这就是 L1 学的 append reducer，
// 只是这次装的不是 string，而是消息对象（HumanMessage / AIMessage）。
//
// 小知识：messages 这个 channel 太常用了，LangGraph 内置了 MessagesAnnotation
// 直接用，省得自己写 reducer。这里手写是为了让你看清它没有魔法。
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});
type State = typeof StateAnnotation.State;

// ============================================================
// 2. 模型：指向 DeepSeek（OpenAI 兼容协议）
// ============================================================
const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: "https://api.deepseek.com/v1" },
  temperature: 0.7,
});

// ============================================================
// 3. agent 节点：吃 messages，调 LLM，把回复追加回 messages
// ============================================================
// 注意它的形状和 L1 的 incrementNode 一模一样：
//   输入完整 State → 返回对 State 的局部更新 { messages: [新消息] }
// reducer 负责把这条新消息 append 进历史。
async function agentNode(state: State): Promise<Partial<State>> {
  const response = await model.invoke(state.messages); // 返回一条 AIMessage
  return { messages: [response] };
}

// ============================================================
// 4. 组图：START → agent → END（这次没有环，单步问答）
// ============================================================
const graph = new StateGraph(StateAnnotation)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)
  .compile();

// ============================================================
// 5. 跑：一次性拿结果
// ============================================================
async function runOnce() {
  console.log("\n===== 方式一：graph.invoke（等全部生成完）=====");
  const result = await graph.invoke({
    messages: [new HumanMessage("用一句话解释什么是闭包")],
  });

  // result.messages 现在有两条：[HumanMessage, AIMessage]
  console.log("messages 条数:", result.messages.length);
  const last = result.messages.at(-1) as AIMessage;
  console.log("AI 回复:", last.content);
}

// ============================================================
// 6. 进阶：流式，看 token 一个个出来（L2 的可视化页演示的就是这个）
// ============================================================
async function runStreaming() {
  console.log("\n===== 方式二：model.stream（token 流式）=====");
  const stream = await model.stream([
    new HumanMessage("用三句话介绍 LangGraph 是什么"),
  ]);
  process.stdout.write("AI 流式输出: ");
  for await (const chunk of stream) {
    process.stdout.write(String(chunk.content)); // 一个个 token 打出来
  }
  console.log("\n");
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("❌ 没读到 DEEPSEEK_API_KEY，检查 .env");
    process.exit(1);
  }
  await runOnce();
  await runStreaming();
}

main();
