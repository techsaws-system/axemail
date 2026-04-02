import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const managers = [
    {
        firstName: "Nabeel",
        lastName: "Hassan",
        pseudoName: "Michael Baird",
        email: "michaelbaird@axemail.cloud",
        password: "phd@123",
        role: UserRole.MANAGER,
        dailySendLimit: 0,
    },
    {
        firstName: "Sitwat",
        lastName: "Cyril",
        pseudoName: "Brett Golden",
        email: "brettgolden@axemail.cloud",
        password: "phd@123",
        role: UserRole.MANAGER,
        dailySendLimit: 0,
    },
];

async function main() {
    for (const manager of managers) {
        const existing = await prisma.user.findUnique({
            where: { email: manager.email },
        });

        if (existing) {
            console.log(`User already exists: ${manager.email}`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(manager.password, 10);

        await prisma.user.create({
            data: {
                firstName: manager.firstName,
                lastName: manager.lastName,
                pseudoName: manager.pseudoName,
                email: manager.email,
                password: hashedPassword,
                role: manager.role,
                dailySendLimit: manager.dailySendLimit,
                isActive: true,
            },
        });

        console.log(`Manager created: ${manager.email}`);
    }
}

main()
    .catch((error) => {
        console.error("Error seeding managers:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
