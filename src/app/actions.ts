"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import * as pages from "@/lib/server/pages";
import * as tasks from "@/lib/server/tasks";
import { getWorkspace } from "@/lib/server/workspace";
import { seedWorkspace } from "@/lib/server/seed";
import { databaseSchema, workspaceSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

async function execute<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await work();
    revalidatePath("/workspace", "layout");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof z.ZodError)
      return {
        ok: false,
        error:
          error.issues[0]?.message ?? "Check the information and try again.",
      };
    if (error instanceof Error && "code" in error)
      return {
        ok: false,
        error:
          "This item changed or is no longer available. Refresh and try again.",
      };
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save. Please try again.",
    };
  }
}
export async function createPageAction(input: unknown) {
  return execute(async () => {
    const page = await pages.createPage(input);
    return { id: page.id };
  });
}
export async function updatePageAction(id: string, input: unknown) {
  return execute(async () => {
    await pages.updatePage(id, input);
    return null;
  });
}
export async function deletePageAction(id: string) {
  return execute(async () => {
    await pages.deletePage(id);
    return null;
  });
}
export async function duplicatePageAction(id: string) {
  return execute(() => pages.duplicatePage(id));
}
export async function reorderPagesAction(input: unknown) {
  return execute(async () => {
    await pages.reorderPages(input);
    return null;
  });
}
export async function createTaskAction(input: unknown) {
  return execute(() => tasks.createTask(input));
}
export async function updateTaskAction(id: string, input: unknown) {
  return execute(() => tasks.updateTask(id, input));
}
export async function deleteTaskAction(id: string) {
  return execute(async () => {
    await tasks.deleteTask(id);
    return null;
  });
}
export async function updateWorkspaceAction(input: unknown) {
  return execute(async () => {
    const data = workspaceSchema.parse(input);
    const workspace = await getWorkspace();
    await db.workspace.update({ where: { id: workspace.id }, data });
    return null;
  });
}
export async function resetWorkspaceAction(confirmation: unknown) {
  return execute(async () => {
    z.literal("RESET").parse(confirmation);
    await seedWorkspace(true);
    return null;
  });
}
export async function createDatabaseAction(input: unknown) {
  return execute(async () => {
    const data = databaseSchema.parse(input);
    const workspace = await getWorkspace();
    const database = await db.database.create({
      data: { ...data, workspaceId: workspace.id },
    });
    return { id: database.id };
  });
}
export async function updateDatabaseAction(id: string, input: unknown) {
  return execute(async () => {
    const data = databaseSchema.parse(input);
    const workspace = await getWorkspace();
    await db.database.update({
      where: { id, workspaceId: workspace.id },
      data,
    });
    return null;
  });
}
export async function deleteDatabaseAction(id: string) {
  return execute(async () => {
    const workspace = await getWorkspace();
    await db.database.delete({ where: { id, workspaceId: workspace.id } });
    return null;
  });
}
