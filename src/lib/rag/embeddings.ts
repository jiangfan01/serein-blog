import { ChatOpenAI } from "@langchain/openai";
import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

// LLM: Kimi (Moonshot) — OpenAI 兼容格式
export function createLLM() {
  return new ChatOpenAI({
    model: "kimi-k2-0711-preview",
    apiKey: process.env.MOONSHOT_API_KEY,
    configuration: {
      baseURL: "https://api.moonshot.cn/v1",
    },
    streaming: true,
  });
}

/**
 * Embedding: 硅基流动 SiliconFlow — 免费的 BAAI/bge-m3 模型
 * 输出 1024 维向量，兼容 OpenAI embedding API 格式
 */
export class SiliconFlowEmbeddings extends Embeddings {
  private apiKey: string;
  private model: string;

  constructor(params?: EmbeddingsParams & { apiKey?: string; model?: string }) {
    super(params ?? {});
    this.apiKey = params?.apiKey || process.env.SILICONFLOW_API_KEY || "";
    this.model = params?.model || "BAAI/bge-m3";
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    // 批量请求，每次最多 10 条
    for (let i = 0; i < texts.length; i += 10) {
      const batch = texts.slice(i, i + 10);
      const res = await fetch("https://api.siliconflow.cn/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: batch,
          encoding_format: "float",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`SiliconFlow embedding error: ${res.status} ${err}`);
      }

      const json = await res.json();
      for (const item of json.data) {
        results.push(item.embedding);
      }
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    const [result] = await this.embedDocuments([text]);
    return result;
  }
}

export function createEmbeddings() {
  return new SiliconFlowEmbeddings();
}
