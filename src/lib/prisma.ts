import "dotenv/config";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function resolveSqliteUrl(rawUrl: string) {
  if (!rawUrl.startsWith("file:")) {
    return rawUrl;
  }

  const relativePath = rawUrl.slice("file:".length);
  if (!relativePath) {
    return rawUrl;
  }

  const normalizedPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);

  return `file:${normalizedPath.replace(/\\/g, "/")}`;
}

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const adapter = new PrismaBetterSqlite3({
      url: resolveSqliteUrl(process.env.DATABASE_URL || "file:./prisma/dev.db"),
    });

    return new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
