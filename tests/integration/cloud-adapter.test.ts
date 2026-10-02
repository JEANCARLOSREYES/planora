import { afterAll, beforeAll, expect, it } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

// Verifies the hosted driver against a disposable local libSQL database.
// A real hosted endpoint and redeployment persistence still require staging.
const directory = mkdtempSync(join(tmpdir(), "planora-libsql-"));
const filename = join(directory, "test.db");
const client = new PrismaClient({
  adapter: new PrismaLibSql({ url: `file:${filename}` }),
});
beforeAll(() => {
  const sqlite = new Database(filename);
  for (const migration of readdirSync("prisma/migrations")
    .filter((name) => /^\d/.test(name))
    .sort()) {
    sqlite.exec(
      readFileSync(
        join("prisma/migrations", migration, "migration.sql"),
        "utf8",
      ),
    );
  }
  sqlite.close();
});
afterAll(async () => {
  await client.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});
it("supports ownership, transactional JSON pages, timestamps, rate limits, and deletion with the cloud driver", async () => {
  const user = await client.user.create({
    data: { id: "cloud-test", name: "Planner", email: "cloud@example.com" },
  });
  const workspace = await client.workspace.create({
    data: { ownerId: user.id },
  });
  const page = await client.$transaction((tx) =>
    tx.page.create({
      data: {
        workspaceId: workspace.id,
        title: "Private",
        content: { type: "doc", content: [] },
      },
    }),
  );
  expect(page.createdAt).toBeInstanceOf(Date);
  expect(page.content).toEqual({ type: "doc", content: [] });
  await client.rateLimit.create({
    data: {
      id: "limit",
      key: "test-key",
      count: 1,
      lastRequest: BigInt(Date.now()),
    },
  });
  expect(
    (await client.rateLimit.findUniqueOrThrow({ where: { key: "test-key" } }))
      .lastRequest,
  ).toBeTypeOf("bigint");
  await client.user.delete({ where: { id: user.id } });
  expect(await client.workspace.count()).toBe(0);
  expect(await client.page.count()).toBe(0);
});
