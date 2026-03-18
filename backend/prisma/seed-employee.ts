import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const employees = [
    {
        firstName: "Nabeel",
        lastName: "Hassan",
        pseudoName: "Michael Baird",
        email: "michaelbaird@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Sitwat",
        lastName: "Cyril",
        pseudoName: "Brett Golden",
        email: "brettgolden@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Asad",
        lastName: "Irfan",
        pseudoName: "Jeff Miller",
        email: "jeffmiller@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Sandeer",
        lastName: "Hamid",
        pseudoName: "Fred Thompson",
        email: "fredthompson@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Sameer",
        lastName: "Javed",
        pseudoName: "Kevin Fernendes",
        email: "kevinfernendes@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Hassan",
        lastName: "Ahmed",
        pseudoName: "Ryan Copper",
        email: "ryancopper@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Muhammad",
        lastName: "Waleed",
        pseudoName: "Pseudo Missing",
        email: "pseudomissing01@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Muhammad",
        lastName: "Azeem",
        pseudoName: "Pseudo Missing",
        email: "pseudomissing02@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Abdul",
        lastName: "Basit",
        pseudoName: "Michael Brown",
        email: "michaelbrown@axemail.cloud",
        password: "phd@123",
    },
    {
        firstName: "Muhammad",
        lastName: "Amaar",
        pseudoName: "Mark Brown",
        email: "markbrown@axemail.cloud",
        password: "phd@123",
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
