import { PRIORITIES, STATUSES, type TaskRecord } from "./types";
export type TaskFilters = {
  query: string;
  status: string;
  priority: string;
  tag: string;
  due: string;
  sort: string;
  direction: "asc" | "desc";
  today: string;
};
export function filterTasks(tasks: TaskRecord[], filters: TaskFilters) {
  const query = filters.query.toLowerCase().trim();
  return tasks
    .filter((task) => {
      if (
        query &&
        !`${task.title} ${task.description} ${task.tags.map((tag) => tag.name).join(" ")}`
          .toLowerCase()
          .includes(query)
      )
        return false;
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.tag && !task.tags.some((tag) => tag.name === filters.tag))
        return false;
      if (
        filters.due === "today" &&
        (task.dueDate !== filters.today || task.status === "COMPLETED")
      )
        return false;
      if (
        filters.due === "overdue" &&
        (!task.dueDate ||
          task.dueDate >= filters.today ||
          task.status === "COMPLETED")
      )
        return false;
      if (filters.due === "undated" && task.dueDate) return false;
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      if (filters.sort === "title") result = a.title.localeCompare(b.title);
      else if (filters.sort === "status")
        result = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      else if (filters.sort === "priority")
        result =
          PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority);
      else if (filters.sort === "dueDate") {
        // Undated tasks stay last in both directions.
        if (!a.dueDate) return b.dueDate ? 1 : 0;
        if (!b.dueDate) return -1;
        result = a.dueDate.localeCompare(b.dueDate);
      } else result = b.createdAt.localeCompare(a.createdAt);
      return filters.direction === "asc" ? result : -result;
    });
}
