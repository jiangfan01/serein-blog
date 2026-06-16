/**
 * LangGraph L5：checkpointer 断点续传 / 跨调用记忆
 *
 * 运行：pnpm exec tsx learn/05-checkpointer.ts
 *
 * 回答之前那个问题"State 存哪"：默认即焚。加了 checkpointer，State 就被
 * 按 thread_id 存下来，下次同一个 thread_id 再 invoke，自动接着上次的状态走。
 *
 * 对照：
 *   - 你 serein-blog 的 ChatExecution 表（手动记进度恢复）
 *   - 上家 Eino 的 compose.CheckPointStore + WithCheckPointID(sessionID)
 */

import "dotenv/config";
import { StateGraph, Annotation, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { type BaseMessage, HumanMessage } from "@langchain/core/messages";

const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next], // append：对话累积
    default: () => [],
  }),
});
type State = typeof StateAnnotation.State;

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: "https://api.deepseek.com/v1" },
  temperature: 0.3,
});

async function agentNode(state: State): Promise<Partial<State>> {
  const res = await model.invoke(state.messages);
  return { messages: [res] };
}

// ============================================================
// 关键：compile 时传入 checkpointer
// ============================================================
// MemorySaver = 存在内存里的 checkpointer（demo 用）。
// 生产换 PostgresSaver / RedisSaver，就能跨进程、跨重启持久化。
// 这一个参数，就是"State 即焚" → "State 长存"的开关。
const checkpointer = new MemorySaver();

const graph = new StateGraph(StateAnnotation)
  .addNode("agent", agentNode)
  .addEdge(START, "agent")
  .addEdge("agent", END)
  .compile({ checkpointer }); // ← 对比 L2/L3 这里是空的

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("❌ 没读到 DEEPSEEK_API_KEY");
    process.exit(1);
  }

  // thread_id 就是"这段记忆属于谁"的钥匙
  const serein = { configurable: { thread_id: "user-serein" } };

  // —— 第 1 次：告诉它我是谁
  let r = await graph.invoke(
    { messages: [new HumanMessage("记住：我叫 Serein，是个前端工程师。")] },
    serein
  );
  console.log("【轮1】AI:", r.messages.at(-1)?.content);

  // —— 第 2 次：同一个 thread_id，注意我【没有】重新传历史！
  // checkpointer 自动把上次的 state 取出来，append 新消息后接着跑。
  r = await graph.invoke(
    { messages: [new HumanMessage("我叫什么？做什么的？")] },
    serein
  );
  console.log("【轮2·同thread】AI:", r.messages.at(-1)?.content);
  console.log("   → state 里现在有", r.messages.length, "条消息（记忆累积了）");

  // —— 第 3 次：换一个 thread_id = 全新的人，啥都不记得
  const stranger = { configurable: { thread_id: "someone-else" } };
  r = await graph.invoke(
    { messages: [new HumanMessage("我叫什么？")] },
    stranger
  );
  console.log("【轮3·新thread】AI:", r.messages.at(-1)?.content);

  // —— 直接读某个 thread 存了什么（断点续传/调试就靠这个）
  const saved = await graph.getState(serein);
  console.log("\n📦 thread 'user-serein' 的存档里有", saved.values.messages.length, "条消息。");
  console.log("   换个 thread_id 就是另一份存档，互不干扰。");
}

main();
