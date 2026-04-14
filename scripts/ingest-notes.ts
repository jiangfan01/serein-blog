/**
 * 文档入库脚本：读取 MDX 笔记 → LangChain 切片 → embedding → 存入 PostgreSQL
 * 运行: npx tsx scripts/ingest-notes.ts
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { SiliconFlowEmbeddings } from "../src/lib/rag/embeddings";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const embeddings = new SiliconFlowEmbeddings();

interface RawDoc {
  content: string;
  metadata: { source: string; category: string; title: string };
}

// 1. 读取所有 MDX 文件
function loadMdxFiles(): RawDoc[] {
  const contentDir = path.join(process.cwd(), "src/content");
  const docs: RawDoc[] = [];

  function walk(dir: string, category: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), entry.name);
      } else if (entry.name.endsWith(".mdx") && entry.name !== "index.mdx") {
        const filePath = path.join(dir, entry.name);
        const raw = fs.readFileSync(filePath, "utf-8");
        // 去掉 frontmatter 和 import 语句
        const content = raw
          .replace(/^---[\s\S]*?---\n?/, "")
          .replace(/^import\s+.*$/gm, "")
          .trim();

        if (!content || content.length < 50) return;

        const title = entry.name.replace(".mdx", "").replace(/-/g, " ");
        docs.push({
          content,
          metadata: { source: filePath, category, title },
        });
      }
    }
  }

  walk(contentDir, "general");
  return docs;
}

async function main() {
  console.log("📖 读取 MDX 笔记文件...");
  const docs = loadMdxFiles();
  console.log(`  找到 ${docs.length} 个文档`);

  // 2. LangChain 文本切片
  console.log("✂️  切片中...");
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 200,
  });

  interface Chunk {
    content: string;
    metadata: { source: string; category: string; title: string };
  }

  const allChunks: Chunk[] = [];
  for (const doc of docs) {
    const chunks = await splitter.createDocuments(
      [doc.content],
      [doc.metadata]
    );
    for (const chunk of chunks) {
      allChunks.push({
        content: chunk.pageContent,
        metadata: chunk.metadata as Chunk["metadata"],
      });
    }
  }
  console.log(`  生成 ${allChunks.length} 个切片`);

  // 3. 清空旧数据
  console.log("🗑️  清空旧数据...");
  await prisma.$executeRawUnsafe("DELETE FROM document_chunks");

  // 4. 批量 embedding + 入库
  console.log("🧠 生成 embedding 并入库...");
  const batchSize = 10;
  let inserted = 0;

  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.content);

    const vectors = await embeddings.embedDocuments(texts);

    for (let j = 0; j < batch.length; j++) {
      const chunk = batch[j];
      const vector = vectors[j];
      const vectorStr = `[${vector.join(",")}]`;

      await prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (id, content, metadata, embedding, "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3::vector, NOW())`,
        chunk.content,
        JSON.stringify(chunk.metadata),
        vectorStr
      );
      inserted++;
    }

    console.log(`  已入库 ${inserted}/${allChunks.length}`);
  }

  console.log(`✅ 完成！共入库 ${inserted} 个向量切片`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ 入库失败:", err);
  process.exit(1);
});
