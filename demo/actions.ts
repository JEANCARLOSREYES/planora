import { z } from "zod";
import {
  pageCreateSchema,
  pageUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  databaseSchema,
  workspaceSchema,
  reorderSchema,
} from "../src/lib/validation";
import {
  validateParent,
  descendantIds,
  completionFields,
} from "../src/lib/hierarchy";
import type { ActionResult } from "../src/lib/types";
import { mutate, seed, createDemoPage, type DemoStore } from "./store";
async function execute<T>(
  work: (store: DemoStore) => T,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: mutate(work) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof z.ZodError
          ? error.issues[0].message
          : error instanceof Error
            ? error.message
            : "Could not save the browser demo. Check available browser storage.",
    };
  }
}
function pageById(store: DemoStore, id: string) {
  const page = store.pages.find((p) => p.id === id);
  if (!page) throw new Error("This page no longer exists.");
  return page;
}
function taskById(store: DemoStore, id: string) {
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error("This task no longer exists.");
  return task;
}
function databaseExists(store: DemoStore, id?: string | null) {
  if (id && !store.databases.some((d) => d.id === id))
    throw new Error("This database no longer exists.");
}
export function createPageAction(input: unknown) {
  return execute((store) => {
    const data = pageCreateSchema.parse(input);
    validateParent(store.pages, null, data.parentId ?? null);
    return {
      id: createDemoPage(
        store,
        data.title,
        data.parentId ?? null,
        data.template,
      ).id,
    };
  });
}
export function updatePageAction(id: string, input: unknown) {
  return execute((store) => {
    const data = pageUpdateSchema.parse(input);
    const page = pageById(store, id);
    if (data.parentId !== undefined)
      validateParent(store.pages, id, data.parentId);
    Object.assign(page, data, { updatedAt: new Date().toISOString() });
    return null;
  });
}
export function deletePageAction(id: string) {
  return execute((store) => {
    pageById(store, id);
    const ids = new Set([id, ...descendantIds(store.pages, id)]);
    store.pages = store.pages.filter((p) => !ids.has(p.id));
    return null;
  });
}
export function duplicatePageAction(id: string) {
  return execute((store) => {
    const source = pageById(store, id);
    const branch = [
      source,
      ...store.pages.filter((p) =>
        descendantIds(store.pages, id).includes(p.id),
      ),
    ];
    const ids = new Map(branch.map((p) => [p.id, crypto.randomUUID()]));
    const now = new Date().toISOString();
    store.pages.push(
      ...branch.map((p) => ({
        ...structuredClone(p),
        id: ids.get(p.id)!,
        parentId: p.id === id ? p.parentId : ids.get(p.parentId!)!,
        title: p.id === id ? `${p.title.slice(0, 153)} (copy)` : p.title,
        favorite: false,
        revision: 0,
        createdAt: now,
        updatedAt: now,
      })),
    );
    return { id: ids.get(id)! };
  });
}
export function reorderPagesAction(input: unknown) {
  return execute((store) => {
    const data = reorderSchema.parse(input);
    const siblings = store.pages.filter((p) => p.parentId === data.parentId);
    if (
      new Set(data.ids).size !== siblings.length ||
      data.ids.length !== siblings.length ||
      siblings.some((p) => !data.ids.includes(p.id))
    )
      throw new Error("The page list changed. Refresh and try again.");
    data.ids.forEach((id, position) => {
      pageById(store, id).position = position;
    });
    return null;
  });
}
export function createTaskAction(input: unknown) {
  return execute((store) => {
    const { tags, ...data } = taskCreateSchema.parse(input);
    databaseExists(store, data.databaseId);
    const now = new Date().toISOString();
    const task = {
      ...data,
      id: crypto.randomUUID(),
      tags: tags.map((name) => ({ id: name, name })),
      createdAt: now,
      updatedAt: now,
      completedAt: data.status === "COMPLETED" ? now : null,
    };
    store.tasks.push(task);
    return task;
  });
}
export function updateTaskAction(id: string, input: unknown) {
  return execute((store) => {
    const { tags, ...data } = taskUpdateSchema.parse(input);
    databaseExists(store, data.databaseId);
    const task = taskById(store, id);
    Object.assign(task, data, { updatedAt: new Date().toISOString() });
    if (tags) task.tags = tags.map((name) => ({ id: name, name }));
    if (data.status)
      task.completedAt =
        completionFields(
          data.status,
          task.completedAt ? new Date(task.completedAt) : null,
        ).completedAt?.toISOString() ?? null;
    return task;
  });
}
export function deleteTaskAction(id: string) {
  return execute((store) => {
    taskById(store, id);
    store.tasks = store.tasks.filter((t) => t.id !== id);
    return null;
  });
}
export function updateWorkspaceAction(input: unknown) {
  return execute((store) => {
    store.name = workspaceSchema.parse(input).name;
    return null;
  });
}
export function resetWorkspaceAction(input: unknown) {
  return execute((store) => {
    z.literal("RESET").parse(input);
    Object.assign(store, seed());
    return null;
  });
}
export function createDatabaseAction(input: unknown) {
  return execute((store) => {
    const data = databaseSchema.parse(input);
    const database = { ...data, id: crypto.randomUUID(), icon: "📋" };
    store.databases.push(database);
    return { id: database.id };
  });
}
export function updateDatabaseAction(id: string, input: unknown) {
  return execute((store) => {
    databaseExists(store, id);
    Object.assign(
      store.databases.find((d) => d.id === id)!,
      databaseSchema.parse(input),
    );
    return null;
  });
}
export function deleteDatabaseAction(id: string) {
  return execute((store) => {
    databaseExists(store, id);
    store.databases = store.databases.filter((d) => d.id !== id);
    store.tasks.forEach((t) => {
      if (t.databaseId === id) t.databaseId = null;
    });
    return null;
  });
}
