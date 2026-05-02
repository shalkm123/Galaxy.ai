// import { neonConfig } from "@neondatabase/serverless";
// import { PrismaClient } from "@prisma/client";
// import { PrismaNeon } from "@prisma/adapter-neon";
// import ws from "ws";

// neonConfig.webSocketConstructor = ws;

// const globalForPrisma = globalThis as unknown as {
//     prisma: PrismaClient | undefined;
// };

// function getPrismaClient() {
//     const connectionString = process.env.DATABASE_URL;

//     if (!connectionString) {
//         throw new Error("DATABASE_URL environment variable is not set");
//     }

//     const adapter = new PrismaNeon({ connectionString });

//     return new PrismaClient({
//         adapter,
//         log: ["error"],
//     });
// }

// export const prisma =
//     globalForPrisma.prisma ?? getPrismaClient();

// if (process.env.NODE_ENV !== "production") {
//     globalForPrisma.prisma = prisma;
// }

import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function getPrismaClient() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const pool = new Pool({
        connectionString,
    });

    const adapter = new PrismaNeon(pool);

    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
