import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { pgConfig } from "../src/lib/pg-config";

const prisma = new PrismaClient({ adapter: new PrismaPg(pgConfig()) });

async function main() {
  const email = process.env.SEED_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    // Runs on every Vercel build, so a missing var shouldn't fail the deploy.
    console.warn("SEED_EMAIL / SEED_PASSWORD not set, skipping user seed");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: process.env.SEED_NAME },
    create: { email, passwordHash, name: process.env.SEED_NAME },
  });
  console.log(`Seeded user ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
