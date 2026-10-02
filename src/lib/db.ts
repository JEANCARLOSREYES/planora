import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function adapter() {
  if (process.env.TURSO_DATABASE_URL) {
    if (
      !process.env.TURSO_DATABASE_URL.startsWith("libsql://") ||
      !process.env.TURSO_AUTH_TOKEN
    ) {
      throw new Error(
        "Hosted SQLite requires a libsql:// URL and a private authentication token.",
      );
    }
    return new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
}

const globalDb = globalThis as unknown as { planoraDb?: PrismaClient };
export const db =
  globalDb.planoraDb ??
  new PrismaClient({
    adapter: adapter(),
  });
if (process.env.NODE_ENV !== "production") globalDb.planoraDb = db;
