import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { getTasks } from "@/lib/server/queries";
export const metadata = { title: "Tasks" };
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <TaskWorkspace
      key={`${params.tag ?? ""}:${params.due ?? ""}`}
      tasks={await getTasks()}
    />
  );
}
