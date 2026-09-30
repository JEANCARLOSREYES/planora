import { describe, expect, it } from "vitest";
import { filterTasks, type TaskFilters } from "@/lib/task-filters";
import type { TaskRecord } from "@/lib/types";
const defaults: TaskFilters = {
  query: "",
  status: "",
  priority: "",
  tag: "",
  due: "",
  sort: "dueDate",
  direction: "asc",
  today: "2026-09-05",
};
const base = {
  description: "",
  databaseId: null,
  completedAt: null,
  tags: [],
  createdAt: "2026-09-01",
  updatedAt: "2026-09-01",
};
const tasks: TaskRecord[] = [
  {
    ...base,
    id: "1",
    title: "Write",
    status: "NOT_STARTED",
    priority: "HIGH",
    dueDate: "2026-09-04",
    tags: [{ id: "a", name: "work" }],
  },
  {
    ...base,
    id: "2",
    title: "Read",
    status: "COMPLETED",
    priority: "LOW",
    dueDate: "2026-09-04",
  },
  {
    ...base,
    id: "3",
    title: "Plan",
    status: "IN_PROGRESS",
    priority: "URGENT",
    dueDate: "2026-09-05",
  },
  {
    ...base,
    id: "4",
    title: "Think",
    status: "NOT_STARTED",
    priority: "MEDIUM",
    dueDate: null,
  },
];
describe("task views", () => {
  it("excludes completed tasks from overdue and today filters", () => {
    expect(
      filterTasks(tasks, { ...defaults, due: "overdue" }).map(
        (task) => task.id,
      ),
    ).toEqual(["1"]);
    expect(
      filterTasks(tasks, { ...defaults, due: "today" }).map((task) => task.id),
    ).toEqual(["3"]);
  });
  it("searches tags and combines filters", () => {
    expect(
      filterTasks(tasks, { ...defaults, query: "WORK", priority: "HIGH" }),
    ).toHaveLength(1);
  });
  it("sorts urgent first without mutating the source", () => {
    expect(
      filterTasks(tasks, { ...defaults, sort: "priority" }).map(
        (task) => task.id,
      ),
    ).toEqual(["3", "1", "4", "2"]);
    expect(tasks[0].id).toBe("1");
  });
  it("keeps undated tasks last in both date directions", () => {
    for (const direction of ["asc", "desc"] as const)
      expect(filterTasks(tasks, { ...defaults, direction }).at(-1)?.id).toBe(
        "4",
      );
  });
});
