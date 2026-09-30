import { notFound } from "next/navigation";
import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { getTasks } from "@/lib/server/queries";
import { getWorkspace } from "@/lib/server/workspace";
import { db } from "@/lib/db";
export default async function DatabasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getWorkspace();
  const database = await db.database.findFirst({
    where: { id, workspaceId: workspace.id },
    select: { id: true, name: true, description: true, icon: true },
  });
  if (!database) notFound();
  return (
    <TaskWorkspace key={id} tasks={await getTasks(id)} database={database} />
  );
}
