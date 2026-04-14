import { NextRequest } from "next/server";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { createLLM } from "@/lib/rag/embeddings";
import { retrieveContext } from "@/lib/rag/retriever";

const SYSTEM_WITH_CONTEXT = `你是 Serein Blog 的 AI 助手，基于博客笔记内容回答用户的技术问题。
回答要准确、简洁，使用中文。如果笔记内容不足以回答问题，可以结合自身知识补充，但要说明哪些是笔记内容、哪些是补充。

以下是检索到的相关笔记内容：
---
{context}
---`;

const SYSTEM_NO_CONTEXT = `你是 Serein Blog 的 AI 助手，帮助用户回答技术问题。回答要准确、简洁，使用中文。
当前没有检索到相关笔记内容，请基于自身知识回答。`;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json({ error: "请输入问题" }, { status: 400 });
    }

    // RAG: 向量检索相关笔记
    const context = await retrieveContext(question);

    // LangChain: 构建 prompt + chain
    const llm = createLLM();
    const prompt = context
      ? ChatPromptTemplate.fromMessages([
          SystemMessagePromptTemplate.fromTemplate(SYSTEM_WITH_CONTEXT),
          HumanMessagePromptTemplate.fromTemplate("{question}"),
        ])
      : ChatPromptTemplate.fromMessages([
          ["system", SYSTEM_NO_CONTEXT],
          HumanMessagePromptTemplate.fromTemplate("{question}"),
        ]);

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    // 流式输出
    const stream = await chain.stream({
      context: context || "",
      question,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "生成回答时出错" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json({ error: "服务器错误" }, { status: 500 });
  }
}
