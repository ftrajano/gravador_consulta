import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: "file:/Users/ftrajano/projetos/gravador_consulta/prisma/dev.db",
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
