/**
 * 模型配置种子数据
 *
 * 初始化模型提供商、模型配置、路由规则
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// 使用 adapter 模式连接数据库
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 开始初始化模型配置...");

  // ============ 1. 创建提供商 ============
  const deepseek = await prisma.modelProvider.upsert({
    where: { name: "deepseek" },
    update: {},
    create: {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com",
      apiKeyEnv: "DEEPSEEK_API_KEY",
      enabled: true,
    },
  });
  console.log("✅ 创建提供商: DeepSeek");

  const kimi = await prisma.modelProvider.upsert({
    where: { name: "kimi" },
    update: {},
    create: {
      name: "kimi",
      baseUrl: "https://api.moonshot.cn/v1",
      apiKeyEnv: "MOONSHOT_API_KEY",
      enabled: true,
    },
  });
  console.log("✅ 创建提供商: Kimi");

  // ============ 2. 创建模型配置 ============
  const models = [
    {
      providerId: deepseek.id,
      modelId: "deepseek-flash",
      modelName: "deepseek-v4-flash",
      displayName: "DeepSeek Flash",
      contextLength: 1000000,
      inputPrice: new Prisma.Decimal(0.001), // 1元/百万token = 0.001元/千token
      outputPrice: new Prisma.Decimal(0.002),
      capabilities: ["chat", "tool_call"],
      extraParams: null,
      priority: 100,
    },
    {
      providerId: deepseek.id,
      modelId: "deepseek-pro",
      modelName: "deepseek-v4-pro",
      displayName: "DeepSeek Pro",
      contextLength: 1000000,
      inputPrice: new Prisma.Decimal(0.003), // 限时2.5折后的价格
      outputPrice: new Prisma.Decimal(0.006),
      capabilities: ["chat", "tool_call", "thinking"],
      extraParams: {
        thinking: { type: "enabled" },
        reasoningEffort: "medium",
      },
      priority: 90,
    },
    {
      providerId: kimi.id,
      modelId: "kimi-8k",
      modelName: "moonshot-v1-8k",
      displayName: "Kimi 8K",
      contextLength: 8000,
      inputPrice: new Prisma.Decimal(0.012),
      outputPrice: new Prisma.Decimal(0.012),
      capabilities: ["chat", "tool_call"],
      extraParams: null,
      priority: 70,
    },
    {
      providerId: kimi.id,
      modelId: "kimi-32k",
      modelName: "moonshot-v1-32k",
      displayName: "Kimi 32K",
      contextLength: 32000,
      inputPrice: new Prisma.Decimal(0.024),
      outputPrice: new Prisma.Decimal(0.024),
      capabilities: ["chat", "tool_call"],
      extraParams: null,
      priority: 80,
    },
    {
      providerId: kimi.id,
      modelId: "kimi-128k",
      modelName: "moonshot-v1-128k",
      displayName: "Kimi 128K",
      contextLength: 128000,
      inputPrice: new Prisma.Decimal(0.06),
      outputPrice: new Prisma.Decimal(0.06),
      capabilities: ["chat", "tool_call", "long_context"],
      extraParams: null,
      priority: 85,
    },
    {
      providerId: kimi.id,
      modelId: "kimi-k2",
      modelName: "kimi-k2-0711-preview",
      displayName: "Kimi K2",
      contextLength: 128000,
      inputPrice: new Prisma.Decimal(0.06),
      outputPrice: new Prisma.Decimal(0.06),
      capabilities: ["chat", "tool_call", "long_context"],
      extraParams: null,
      priority: 95,
    },
  ];

  for (const model of models) {
    await prisma.modelConfig.upsert({
      where: { modelId: model.modelId },
      update: model,
      create: model,
    });
    console.log(`✅ 创建模型: ${model.displayName}`);
  }

  // ============ 3. 创建路由规则 ============
  // 先获取模型 ID
  const deepseekFlash = await prisma.modelConfig.findUnique({
    where: { modelId: "deepseek-flash" },
  });
  const deepseekPro = await prisma.modelConfig.findUnique({
    where: { modelId: "deepseek-pro" },
  });
  const kimi128k = await prisma.modelConfig.findUnique({
    where: { modelId: "kimi-128k" },
  });
  const kimiK2 = await prisma.modelConfig.findUnique({
    where: { modelId: "kimi-k2" },
  });

  if (!deepseekFlash || !deepseekPro || !kimi128k || !kimiK2) {
    throw new Error("模型配置创建失败");
  }

  const rules = [
    {
      name: "简单闲聊路由",
      description: "简单问候、闲聊使用最便宜的模型",
      intentType: "simple_chat",
      modelId: deepseekFlash.id,
      fallbackModelId: kimi128k.id,
      weight: 100,
    },
    {
      name: "RAG问答路由",
      description: "知识库检索使用长上下文模型处理检索结果",
      intentType: "rag_query",
      modelId: kimi128k.id,
      fallbackModelId: deepseekFlash.id,
      weight: 100,
    },
    {
      name: "联网搜索路由",
      description: "联网搜索结果不长，使用便宜模型",
      intentType: "web_search",
      modelId: deepseekFlash.id,
      fallbackModelId: kimi128k.id,
      weight: 100,
    },
    {
      name: "复杂推理路由",
      description: "深度思考问题使用思考模式",
      intentType: "complex_reasoning",
      modelId: deepseekPro.id,
      fallbackModelId: kimiK2.id,
      weight: 100,
    },
    {
      name: "代码分析路由",
      description: "代码审查、分析使用强推理模型",
      intentType: "code_analysis",
      modelId: deepseekPro.id,
      fallbackModelId: kimiK2.id,
      weight: 100,
    },
  ];

  for (const rule of rules) {
    // 先删除已存在的规则（因为有唯一约束）
    await prisma.routingRule.deleteMany({
      where: { intentType: rule.intentType, weight: rule.weight },
    });
    await prisma.routingRule.create({ data: rule });
    console.log(`✅ 创建路由规则: ${rule.name}`);
  }

  console.log("\n🎉 模型配置初始化完成！");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
