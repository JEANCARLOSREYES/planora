import { db } from "@/lib/db";
import { getWorkspace } from "./workspace";
import type { PageSummary, TaskRecord } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

export const pageSelect = {
  id: true,
  title: true,
  icon: true,
  parentId: true,
  favorite: true,
  position: true,
  cover: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PageSelect;
export function serializePage(
  page: Prisma.PageGetPayload<{ select: typeof pageSelect }>,
): PageSummary {
  return {
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}
export function serializeTask(
  task: Prisma.TaskGetPayload<{ include: { tags: true } }>,
): TaskRecord {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt?.toISOString() ?? null,
  };
}
export async function getSidebarData() {
  const workspace = await getWorkspace();
  const [pages, databases, openTasks] = await Promise.all([
    db.page.findMany({
      where: { workspaceId: workspace.id },
      select: pageSelect,
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    db.database.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, name: true, description: true, icon: true },
      orderBy: { createdAt: "asc" },
    }),
    db.task.count({
      where: { workspaceId: workspace.id, status: { not: "COMPLETED" } },
    }),
  ]);
  return {
    workspaceName: workspace.name,
    pages: pages.map(serializePage),
    databases,
    openTasks,
  };
}
export async function getTasks(databaseId?: string) {
  const workspace = await getWorkspace();
  const tasks = await db.task.findMany({
    where: { workspaceId: workspace.id, ...(databaseId ? { databaseId } : {}) },
    include: { tags: true },
    orderBy: { createdAt: "desc" },
  });
  return tasks.map(serializeTask);
}
