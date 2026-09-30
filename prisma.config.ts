import "dotenv/config";
import { defineConfig } from "prisma/config";
import { prepareDatabaseFile } from "./src/lib/database-file";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  datasource: {
    url: prepareDatabaseFile(
      process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    ),
  },
});
