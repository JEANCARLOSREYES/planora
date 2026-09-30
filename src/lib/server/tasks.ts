import { db } from "@/lib/db";
import { getWorkspace } from "./workspace";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validation";
import { completionFields } from "@/lib/hierarchy";
import { serializeTask } from "./queries";

function connectTags(tags: string[], workspaceId: string) {
  return tags.map((name) => ({
    where: { workspaceId_name: { workspaceId, name } },
    create: { workspaceId, name },
  }));
}
export async function createTask(input: unknown) {
  const { tags, ...data } = taskCreateSchema.parse(input);
  const workspace = await getWorkspace();
  if (data.databaseId)
    await db.database.findFirstOrThrow({
      where: { id: data.databaseId, workspaceId: workspace.id },
    });
  return serializeTask(
    await db.task.create({
      data: {
        ...data,
        ...completionFields(data.status),
        workspaceId: workspace.id,
        tags: { connectOrCreate: connectTags(tags, workspace.id) },
      },
      include: { tags: true },
    }),
  );
}
export async function updateTask(id: string, input: unknown) {
  const { tags, ...data } = taskUpdateSchema.parse(input);
  const workspace = await getWorkspace();
  if (data.databaseId)
    await db.database.findFirstOrThrow({
      where: { id: data.databaseId, workspaceId: workspace.id },
    });
  return db.$transaction(async (tx) => {
    const existing = await tx.task.findFirstOrThrow({
      where: { id, workspaceId: workspace.id },
    });
    const task = await tx.task.update({
      where: { id },
      data: {
        ...data,
        ...(data.status
          ? completionFields(data.status, existing.completedAt)
          : {}),
        ...(tags
          ? {
              tags: {
                set: [],
                connectOrCreate: connectTags(tags, workspace.id),
              },
            }
          : {}),
      },
      include: { tags: true },
    });
    return serializeTask(task);
  });
}
export async function deleteTask(id: string) {
  const workspace = await getWorkspace();
  await db.task.delete({ where: { id, workspaceId: workspace.id } });
}
