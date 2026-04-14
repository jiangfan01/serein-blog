import { prisma } from "@/lib/prisma";
import { createEmbeddings } from "./embeddings";

const embeddings = createEmbeddings();

interface ChunkResult {
  content: string;
  metadata: { source: string; category: string; title: string };
  similarity: number;
}

/**
 * 向量相似度检索：将用户问题 embedding 后，在 pgvector 中做余弦相似度搜索
 */
export async function retrieveContext(
  query: string,
  topK = 3,
  maxChars = 3000
): Promise<string> {
  // 1. 将问题转为向量
  const queryVector = await embeddings.embedQuery(query);
  const vectorStr = `[${queryVector.join(",")}]`;

  // 2. pgvector 余弦相似度搜索
  const results: ChunkResult[] = await prisma.$queryRawUnsafe(
    `SELECT content, metadata, 1 - (embedding <=> $1::vector) AS similarity
     FROM document_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vectorStr,
    topK
  );

  if (!results.length) return "";

  // 3. 拼接上下文
  let context = "";
  for (const r of results) {
    const meta =
      typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata;
    const section = `## ${meta.category} / ${meta.title} (相似度: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}\n\n`;
    if (context.length + section.length > maxChars) {
      context += section.slice(0, maxChars - context.length);
      break;
    }
    context += section;
  }

  return context.trim();
}
