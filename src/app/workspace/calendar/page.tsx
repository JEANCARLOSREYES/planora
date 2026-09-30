import { TaskWorkspace } from "@/components/tasks/task-workspace";
import { getTasks } from "@/lib/server/queries";
export const metadata = { title: "Calendar" };
export default async function CalendarPage() {
  return <TaskWorkspace tasks={await getTasks()} initialView="calendar" />;
}
