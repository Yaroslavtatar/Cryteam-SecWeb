import { PrismaClient } from "@prisma/client";

// Единый экземпляр Prisma. В dev-режиме переиспользуем клиент между
// перезагрузками модулей, чтобы не плодить подключения к SQLite.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
