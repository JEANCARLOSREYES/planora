import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function prepareDatabaseFile(url: string) {
  if (!url.startsWith("file:"))
    throw new Error(
      "Planora requires a local SQLite DATABASE_URL beginning with file:.",
    );
  const path = resolve(url.slice(5));
  mkdirSync(dirname(path), { recursive: true });
  // Some Prisma SQLite engine builds require the file to exist before migration.
  // Append mode creates an empty file only when missing and preserves existing data.
  closeSync(openSync(path, "a"));
  return `file:${path}`;
}
