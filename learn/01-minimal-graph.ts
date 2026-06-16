/**
 * LangGraph L1：纯图机制（故意不碰 LLM）
 *
 * 目标：把 Agent 的"魔法"剥到只剩骨架，让你看清 LangGraph 到底在干什么。
 * 这一课没有任何 LLM 调用，跑起来是瞬间的、确定的——因为我们要先吃透"图"本身。
 *
 * 运行方式：
 *   pnpm exec tsx src/lib/agent/learn/01-minimal-graph.ts
 *
 * 对照你在 Eino 见过的：
 *   - StateGraph        ≈ Eino 的 compose.Graph
 *   - .compile()        ≈ Eino 的 adk.NewRunner(...)
 *   - .invoke(input)    ≈ Eino 的 runner.Run(...)
 */

import { StateGraph, Annotation, START, END } from "@langchain/langgraph";

// ============================================================
// 1. State（状态）：整张图共享的一块"内存"
// ============================================================
// 每个节点都能读它、改它。这就是 LLM 这个"无状态函数"缺的那块外部记忆。
//
// 注意两个字段用了【不同的合并策略(reducer)】，这是 LangGraph 最核心、
// 也最容易被忽略的概念：节点 return 的不是"覆盖"，而是"按 reducer 合并"。
const StateAnnotation = Annotation.Root({
  // value：没写 reducer → 默认策略是"覆盖"（后写的盖掉先写的）
  value: Annotation<number>(),

  // log：自定义 reducer 为"追加" → 每个节点写的日志都会累积，而不是互相覆盖
  // 这正是 agent.ts 里 messages 字段用 [...prev, ...next] 的同款机制。
  log: Annotation<string[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});

// 用类型别名让节点函数签名更清爽
type State = typeof StateAnnotation.State;

// ============================================================
// 2. Node（节点）：干活的纯函数。输入完整 State，输出"对 State 的修改"
// ============================================================
// 关键心智：节点不需要返回整个 State，只返回它想改的那部分字段。
// 剩下的交给 reducer 去合并。

// 节点 A：把 value +1
function incrementNode(state: State): Partial<State> {
  const newValue = state.value + 1;
  return {
    value: newValue, // 覆盖式更新
    log: [`increment: ${state.value} -> ${newValue}`], // 追加式更新（只给一条，reducer 帮你 append）
  };
}

// 节点 B：把 value ×2
function doubleNode(state: State): Partial<State> {
  const newValue = state.value * 2;
  return {
    value: newValue,
    log: [`double: ${state.value} -> ${newValue}`],
  };
}

// ============================================================
// 3. 把节点和边拼成图，然后编译
// ============================================================
// START 和 END 是 LangGraph 的两个特殊内置节点：图的入口和出口。
const graph = new StateGraph(StateAnnotation)
  .addNode("increment", incrementNode)
  .addNode("double", doubleNode)
  .addEdge(START, "increment") // 入口 → increment
  .addEdge("increment", "double") // increment → double（固定边，无条件）
  .addEdge("double", END) // double → 出口
  .compile();

// ============================================================
// 4. 驱动执行
// ============================================================
async function main() {
  const input = { value: 1, log: [] };
  console.log("输入:", input);

  const result = await graph.invoke(input);

  console.log("\n最终 value:", result.value); // 期望: (1+1)*2 = 4
  console.log("\n执行轨迹 log:");
  for (const line of result.log) {
    console.log("  -", line);
  }

  // 思考题（先别看答案，自己推）：
  // 为什么 result.log 有两条，而 result.value 只有最后一个值？
  // 答：log 的 reducer 是"追加"，两个节点各写一条都留下了；
  //     value 没写 reducer 用默认"覆盖"，所以只剩 double 最后写的那个。
}

main();
