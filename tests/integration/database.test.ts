import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";

const directory = mkdtempSync(join(tmpdir(), "planora-test-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db")}`;
const { db } = await import("@/lib/db");
const { seedWorkspace } = await import("@/lib/server/seed");
const {
  createPage,
  updatePage,
  savePageContent,
  deletePage,
  duplicatePage,
  reorderPages,
} = await import("@/lib/server/pages");
const { createTask, updateTask, deleteTask } =
  await import("@/lib/server/tasks");

beforeAll(async () => {
  const sqlite = new Database(join(directory, "test.db"));
  for (const directory of readdirSync("prisma/migrations")
    .filter((name) => /^\d/.test(name))
    .sort())
    sqlite.exec(
      readFileSync(
        join("prisma/migrations", directory, "migration.sql"),
        "utf8",
      ),
    );
  sqlite.close();
  await seedWorkspace();
});
afterAll(async () => {
  await db.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});

describe("SQLite-backed workspace operations", () => {
  it("seeds idempotently without overwriting user data", async () => {
    const before = await db.page.count();
    await seedWorkspace();
    expect(await db.page.count()).toBe(before);
  });
  it("creates, moves, favorites, duplicates, and safely deletes page subtrees", async () => {
    const parent = await createPage({ title: "Parent" });
    const child = await createPage({ title: "Child", parentId: parent.id });
    await expect(updatePage(parent.id, { parentId: child.id })).rejects.toThrow(
      "children",
    );
    await updatePage(child.id, { parentId: null, favorite: true });
    expect(await db.page.findUnique({ where: { id: child.id } })).toMatchObject(
      { parentId: null, favorite: true },
    );
    await updatePage(child.id, { parentId: parent.id });
    const duplicate = await duplicatePage(parent.id);
    expect(await db.page.count({ where: { parentId: duplicate.id } })).toBe(1);
    await deletePage(parent.id);
    expect(await db.page.findUnique({ where: { id: child.id } })).toBeNull();
    expect(
      await db.page.findUnique({ where: { id: duplicate.id } }),
    ).not.toBeNull();
    await deletePage(duplicate.id);
  });
  it("persists editor content and rejects stale revisions without losing saved data", async () => {
    const page = await createPage({ title: "Autosave" });
    const content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "A durable thought" }],
        },
      ],
    };
    expect(await savePageContent(page.id, { content, revision: 0 })).toEqual({
      revision: 1,
    });
    await expect(
      savePageContent(page.id, { content, revision: 0 }),
    ).rejects.toThrow("another tab");
    const saved = await db.page.findUniqueOrThrow({ where: { id: page.id } });
    expect(saved.content).toEqual(content);
    expect(saved.plainText).toContain("A durable thought");
    await deletePage(page.id);
  });
  it("validates reordering as an exact sibling permutation", async () => {
    const parent = await createPage({ title: "Order" });
    const first = await createPage({ title: "First", parentId: parent.id });
    const second = await createPage({ title: "Second", parentId: parent.id });
    await reorderPages({ parentId: parent.id, ids: [second.id, first.id] });
    expect(
      (
        await db.page.findMany({
          where: { parentId: parent.id },
          orderBy: { position: "asc" },
        })
      ).map((page) => page.id),
    ).toEqual([second.id, first.id]);
    await expect(
      reorderPages({ parentId: parent.id, ids: [first.id, first.id] }),
    ).rejects.toThrow("page list changed");
    await deletePage(parent.id);
  });
  it("persists partial task updates without clearing other properties", async () => {
    const database = await db.database.findFirstOrThrow();
    const task = await createTask({
      title: "Ship",
      dueDate: "2026-10-05",
      priority: "URGENT",
      tags: ["Work", "work"],
      databaseId: database.id,
    });
    const updated = await updateTask(task.id, { status: "COMPLETED" });
    expect(updated).toMatchObject({
      status: "COMPLETED",
      priority: "URGENT",
      dueDate: "2026-10-05",
      databaseId: database.id,
    });
    expect(updated.tags.map((tag) => tag.name)).toEqual(["work"]);
    expect(updated.completedAt).not.toBeNull();
    const reopened = await updateTask(task.id, {
      status: "IN_PROGRESS",
      tags: ["personal"],
    });
    expect(reopened.completedAt).toBeNull();
    expect(reopened.tags.map((tag) => tag.name)).toEqual(["personal"]);
    await deleteTask(task.id);
    expect(await db.task.findUnique({ where: { id: task.id } })).toBeNull();
  });
  it("keeps task records when their database is removed", async () => {
    const workspace = await db.workspace.findFirstOrThrow();
    const database = await db.database.create({
      data: { name: "Temporary", workspaceId: workspace.id },
    });
    const task = await createTask({
      title: "Keep me",
      databaseId: database.id,
    });
    await db.database.delete({ where: { id: database.id } });
    expect(await db.task.findUnique({ where: { id: task.id } })).toMatchObject({
      databaseId: null,
      title: "Keep me",
    });
  });
});
