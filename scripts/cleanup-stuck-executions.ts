/**
 * 清理卡住的执行记录
 * 
 * 把超过 5 分钟还在 running 状态的执行记录标记为 failed
 * 
 * 运行: npx tsx scripts/cleanup-stuck-executions.ts
 */
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const result = await prisma.chatExecution.updateMany({
    where: {
      status: "running",
      startedAt: {
        lt: fiveMinutesAgo,
      },
    },
    data: {
      status: "failed",
      result: { error: "执行超时，已自动清理" },
      completedAt: new Date(),
    },
  });

  console.log(`清理了 ${result.count} 条卡住的执行记录`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
