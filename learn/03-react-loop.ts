/**
 * LangGraph L3：亲手造 agent ⇄ tools 循环（ReAct）
 *
 * 这就是 createReactAgent、也是你 agent.ts 的核心。
 * 把 L1 学的【条件边 + 环】和 L2 学的【LLM 节点】合体：
 *
 *   START → agent → (有 tool_calls?) → tools → agent → ... → END
 *                         否 ↓
 *                          END
 *
 * 运行：
 *   pnpm exec tsx src/lib/agent/learn/03-react-loop.ts
 */

import "dotenv/config";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  type BaseMessage,
  type AIMessage,
  HumanMessage,
} from "@langchain/core/messages";

// ============================================================
// 1. State：还是只有 messages（append reducer）
// ============================================================
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
});
type State = typeof StateAnnotation.State;

// ============================================================
// 2. 一个工具：查天气（假数据，真实场景这里调天气 API）
// ============================================================
// 工具的 description 极其关键 —— 它就是写给 LLM 看的"说明书"，
// LLM 靠它判断"什么时候该调我"。这是你说的"调优过的 Tools Description"。
const getWeather = tool(
  async ({ city }: { city: string }) => {
    console.log(`   🔧 [工具执行] get_weather(city="${city}")`);
    const data: Record<string, string> = {
      杭州: "晴，12℃ 到 20℃，微风",
      北京: "多云，5℃ 到 14℃，北风 3 级",
      广州: "阵雨，22℃ 到 28℃，湿度大",
    };
    return data[city] ?? `${city}：暂无数据`;
  },
  {
    name: "get_weather",
    description: "查询某个城市今天的天气。当用户问到天气、气温、是否下雨、穿衣建议时调用。",
    schema: z.object({ city: z.string().describe("城市名，例如 杭州") }),
  }
);

const tools = [getWeather];

// ============================================================
// 3. 两个节点
// ============================================================
// agent 节点：注意 .bindTools(tools) —— 把工具"说明书"告诉 LLM，
// LLM 才有能力在回复里带上 tool_calls。
const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: { baseURL: "https://api.deepseek.com/v1" },
  temperature: 0,
}).bindTools(tools);

let llmCallCount = 0;
async function agentNode(state: State): Promise<Partial<State>> {
  llmCallCount++;
  console.log(`\n🤖 [第 ${llmCallCount} 次调用 LLM] 喂给它 ${state.messages.length} 条消息`);
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

// tools 节点：LangGraph 内置的 ToolNode，自动读最后一条 AIMessage 的 tool_calls，
// 执行对应工具，把结果包成 ToolMessage 追加进 messages。
const toolNode = new ToolNode(tools);

// ============================================================
// 4. 条件边：图的"大脑分叉"
// ============================================================
// 读最后一条消息有没有 tool_calls：有 → 去 tools 执行；没有 → 结束。
// 这就是你 agent.ts 里的 shouldContinue。
function shouldContinue(state: State): "tools" | typeof END {
  const last = state.messages.at(-1) as AIMessage;
  if (last.tool_calls && last.tool_calls.length > 0) {
    console.log(`   ↪ 条件边判断：有 ${last.tool_calls.length} 个 tool_calls → 去 tools`);
    return "tools";
  }
  console.log(`   ↪ 条件边判断：没有 tool_calls → 结束`);
  return END;
}

// ============================================================
// 5. 组图：注意那条回边 tools → agent，就是"环"
// ============================================================
const graph = new StateGraph(StateAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, { tools: "tools", [END]: END })
  .addEdge("tools", "agent") // ← 回边：工具执行完，回到 agent 再想
  .compile();

// ============================================================
// 6. 跑，并把整条消息流打印出来
// ============================================================
function printMessages(messages: BaseMessage[]) {
  console.log("\n========== 最终 messages（共 " + messages.length + " 条）==========");
  for (const m of messages) {
    const type = m.getType();
    if (type === "human") {
      console.log(`👤 HUMAN: ${m.content}`);
    } else if (type === "ai") {
      const ai = m as AIMessage;
      if (ai.tool_calls && ai.tool_calls.length > 0) {
        const calls = ai.tool_calls.map((t) => `${t.name}(${JSON.stringify(t.args)})`).join(", ");
        console.log(`🤖 AI（决定调用工具）: ${calls}`);
      } else {
        console.log(`🤖 AI（最终回复）: ${ai.content}`);
      }
    } else if (type === "tool") {
      console.log(`🔧 TOOL（结果）: ${m.content}`);
    }
  }
}

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("❌ 没读到 DEEPSEEK_API_KEY");
    process.exit(1);
  }
  const result = await graph.invoke({
    messages: [new HumanMessage("杭州今天天气怎么样？适合穿什么？")],
  });

  printMessages(result.messages);
  console.log(`\n💡 总共调用了 ${llmCallCount} 次 LLM。`);
  console.log("   第 1 次：LLM 看到问题，决定调 get_weather；");
  console.log("   工具执行，结果回喂；");
  console.log("   第 2 次：LLM 看到天气结果，才给出穿衣建议。");
  console.log("   这就是'工具结果回喂触发第二次调用'，你上一课说对的那件事。");
}

main();
