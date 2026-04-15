import "dotenv/config";

import { PrismaNeon } from "@prisma/adapter-neon";
import argon2 from "argon2";
import { PrismaClient, Role, UserStatus } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const adminPasswordHash = await argon2.hash("admin1234", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.userSession.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.userSenderAllocation.deleteMany();
  await prisma.senderAccount.deleteMany();
  await prisma.senderPolicy.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "Athurity",
      pseudoName: "Control Master",
      email: "admin@axemail.cloud",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
