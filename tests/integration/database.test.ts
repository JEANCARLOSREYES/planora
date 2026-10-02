import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";

const identity = vi.hoisted(() => ({ id: "alice", anonymous: false }));
vi.mock("@/lib/server/current-user", () => ({
  getCurrentUser: async () => {
    if (identity.anonymous) throw new Error("Please log in to continue.");
    return {
      id: identity.id,
      name: identity.id,
      email: `${identity.id}@example.com`,
    };
  },
}));

const directory = mkdtempSync(join(tmpdir(), "planora-test-"));
process.env.DATABASE_URL = `file:${join(directory, "test.db")}`;
process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
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
  await db.user.createMany({
    data: ["alice", "bob"].map((id) => ({
      id,
      name: id,
      email: `${id}@example.com`,
    })),
  });
  await seedWorkspace(false, "alice");
});
afterAll(async () => {
  await db.$disconnect();
  rmSync(directory, { recursive: true, force: true });
});

describe("SQLite-backed workspace operations", () => {
  it("seeds idempotently without overwriting user data", async () => {
    const before = await db.page.count();
    await seedWorkspace(false, "alice");
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

describe("Account workspace isolation", () => {
  it("rejects another user's page IDs, parent IDs, task IDs, and database IDs", async () => {
    identity.id = "alice";
    const page = await createPage({ title: "Alice private note" });
    const task = await createTask({ title: "Alice private task" });
    const alice = await db.workspace.findUniqueOrThrow({
      where: { ownerId: "alice" },
    });
    const collection = await db.database.create({
      data: { name: "Alice collection", workspaceId: alice.id },
    });
    identity.id = "bob";
    try {
      await expect(
        updatePage(page.id, { title: "Intrusion" }),
      ).rejects.toThrow();
      await expect(deletePage(page.id)).rejects.toThrow();
      await expect(duplicatePage(page.id)).rejects.toThrow();
      await expect(
        savePageContent(page.id, {
          content: { type: "doc", content: [] },
          revision: 0,
        }),
      ).rejects.toThrow();
      await expect(
        createPage({ title: "Intrusion", parentId: page.id }),
      ).rejects.toThrow();
      await expect(
        updateTask(task.id, { title: "Intrusion" }),
      ).rejects.toThrow();
      await expect(deleteTask(task.id)).rejects.toThrow();
      await expect(
        createTask({ title: "Intrusion", databaseId: collection.id }),
      ).rejects.toThrow();
      expect(
        (await db.page.findUniqueOrThrow({ where: { id: page.id } })).title,
      ).toBe("Alice private note");
    } finally {
      identity.id = "alice";
    }
  });
  it("resets only the requesting account and preserves other users and legacy data", async () => {
    const legacy = await seedWorkspace();
    const alice = await db.workspace.findUniqueOrThrow({
      where: { ownerId: "alice" },
    });
    await seedWorkspace(true, "bob");
    expect(
      await db.workspace.findUnique({ where: { id: alice.id } }),
    ).not.toBeNull();
    expect(
      await db.workspace.findUnique({ where: { id: legacy.id } }),
    ).not.toBeNull();
  });
  it("rejects operations without an authenticated account", async () => {
    identity.anonymous = true;
    try {
      await expect(createPage({ title: "Anonymous" })).rejects.toThrow(
        "log in",
      );
    } finally {
      identity.anonymous = false;
    }
  });
  it("cascades account deletion only to its own workspace", async () => {
    const alice = await db.workspace.findUniqueOrThrow({
      where: { ownerId: "alice" },
    });
    const bob = await db.workspace.findUniqueOrThrow({
      where: { ownerId: "bob" },
    });
    await db.user.delete({ where: { id: "bob" } });
    expect(await db.workspace.findUnique({ where: { id: bob.id } })).toBeNull();
    expect(
      await db.workspace.findUnique({ where: { id: alice.id } }),
    ).not.toBeNull();
  });
});
