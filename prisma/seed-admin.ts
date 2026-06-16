/**
 * 创建管理员账号和初始邀请码
 * 
 * 运行: pnpm exec tsx prisma/seed-admin.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import "dotenv/config";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔐 创建管理员账号...");

  // 管理员账号信息（请修改）
  const adminEmail = "admin@serein.blog";
  const adminPassword = "admin123456"; // 请修改为安全密码

  // 检查是否已存在
  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log("⚠️  管理员账号已存在");
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "Serein",
        role: "admin",
        canUseChat: true,
        dailyLimit: 9999, // 管理员无限制
      },
    });
    
    console.log(`✅ 管理员账号创建成功`);
    console.log(`   邮箱: ${adminEmail}`);
    console.log(`   密码: ${adminPassword}`);
  }

  // 创建初始邀请码
  console.log("\n🎫 创建邀请码...");
  
  const codes = [
    { note: "测试用" },
    { note: "朋友" },
  ];

  for (const { note } of codes) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    
    await prisma.inviteCode.create({
      data: {
        code,
        note,
      },
    });
    
    console.log(`✅ 邀请码: ${code} (${note})`);
  }

  console.log("\n🎉 初始化完成！");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
