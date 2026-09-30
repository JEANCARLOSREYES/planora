import { Dashboard } from "@/components/home/dashboard";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/server/workspace";
import { pageSelect, serializePage, serializeTask } from "@/lib/server/queries";
import { todayKey } from "@/lib/utils";
export default async function HomePage() {
  const workspace = await getWorkspace();
  const where = { workspaceId: workspace.id };
  const today = todayKey();
  const [
    recent,
    created,
    tasks,
    totalTasks,
    completedTasks,
    dueToday,
    overdue,
    pageCount,
  ] = await Promise.all([
    db.page.findMany({
      where,
      select: pageSelect,
      orderBy: { updatedAt: "desc" },
      take: 3,
    }),
    db.page.findMany({
      where,
      select: pageSelect,
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    db.task.findMany({
      where: { ...where, status: { not: "COMPLETED" }, dueDate: { not: null } },
      include: { tags: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.task.count({ where }),
    db.task.count({ where: { ...where, status: "COMPLETED" } }),
    db.task.count({
      where: { ...where, status: { not: "COMPLETED" }, dueDate: today },
    }),
    db.task.count({
      where: { ...where, status: { not: "COMPLETED" }, dueDate: { lt: today } },
    }),
    db.page.count({ where }),
  ]);
  return (
    <Dashboard
      data={{
        recent: recent.map(serializePage),
        created: created.map(serializePage),
        tasks: tasks.map(serializeTask),
        totalTasks,
        completedTasks,
        dueToday,
        overdue,
        pageCount,
        today,
      }}
    />
  );
}
