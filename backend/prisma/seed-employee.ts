import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const employees = [
    {
        firstName: "Asad",
        lastName: "Irfan",
        pseudoName: "Jeff Miller",
        email: "jeffmiller@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Sandeer",
        lastName: "Hamid",
        pseudoName: "Fred Thompson",
        email: "fredthompson@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Sameer",
        lastName: "Javed",
        pseudoName: "Kevin Fernendes",
        email: "kevinfernendes@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Hassan",
        lastName: "Ahmed",
        pseudoName: "Ryan Copper",
        email: "ryancopper@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Muhammad",
        lastName: "Waleed",
        pseudoName: "Pseudo Missing",
        email: "pseudomissing01@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Muhammad",
        lastName: "Azeem",
        pseudoName: "Pseudo Missing",
        email: "pseudomissing02@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Abdul",
        lastName: "Basit",
        pseudoName: "Michael Brown",
        email: "michaelbrown@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
    {
        firstName: "Muhammad",
        lastName: "Amaar",
        pseudoName: "Mark Brown",
        email: "markbrown@axemail.cloud",
        password: "phd@123",
        role: UserRole.EMPLOYEE,
        dailySendLimit: 0,
    },
];

async function main() {
    for (const emp of employees) {
        const existing = await prisma.user.findUnique({
            where: { email: emp.email },
        });

        if (existing) {
            console.log(`⚠ User already exists: ${emp.email}`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(emp.password, 10);

        await prisma.user.create({
            data: {
                firstName: emp.firstName,
                lastName: emp.lastName,
                pseudoName: emp.pseudoName,
                email: emp.email,
                password: hashedPassword,
                role: emp.role,
                dailySendLimit: emp.dailySendLimit,
                isActive: true,
            },
        });

        console.log(`✅ Employee created: ${emp.email}`);
    }
}

main()
    .catch((e) => {
        console.error("❌ Error seeding employees:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
