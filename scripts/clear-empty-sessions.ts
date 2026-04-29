/**
 * 清空所有空会话（没有消息的会话）
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("开始清理空会话...");

  // 删除所有没有消息的会话
  const result = await prisma.chatSession.deleteMany({
    where: {
      messages: {
        none: {},
      },
    },
  });

  console.log(`删除了 ${result.count} 个空会话`);

  // 查看剩余会话数
  const remaining = await prisma.chatSession.count();
  console.log(`剩余会话数: ${remaining}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
