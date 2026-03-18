import { app } from "./app";
import { ENV } from "./config/env";
import { prisma } from "./config/prisma";

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log("✅ Database connected");

        const server = app.listen(ENV.PORT, () => {
            if (ENV.NODE_ENV === "production") {
                console.log(`🚀 Axemail backend running in PRODUCTION mode`);
                console.log(`🌍 Listening on port ${ENV.PORT}`);
            } else {
                console.log(
                    `🚀 Axemail backend running on http://localhost:${ENV.PORT}`
                );
            }
        });

        process.on("SIGINT", async () => {
            console.log("🛑 Gracefully shutting down...");
            await prisma.$disconnect();
            server.close(() => {
                console.log("🔒 Server closed");
                process.exit(0);
            });
        });

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
