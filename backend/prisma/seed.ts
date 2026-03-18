import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.user.findUnique({
        where: { email: "admin@axemail.cloud" },
    });

    if (existing) {
        console.log("⚠ Admin user already exists.");
        return;
    }

    const hashedPassword = await bcrypt.hash("admin1234", 10);

    await prisma.user.create({
        data: {
            firstName: "Admin",
            lastName: "Authority",
            pseudoName: "Debugging Master",
            email: "admin@axemail.cloud",
            password: hashedPassword,
        },
    });

    console.log("✅ Admin user created successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
