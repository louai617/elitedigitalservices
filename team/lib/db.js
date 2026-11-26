import { PrismaClient } from "@prisma/client";

// One client per process; in dev, survive hot reloads.
const globalForPrisma = globalThis;
export const db = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
