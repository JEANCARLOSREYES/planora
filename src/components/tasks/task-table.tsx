"use client";
import { useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateTaskAction } from "@/app/actions";
import { useWorkspace } from "@/components/layout/workspace-context";
import { TaskCheck } from "./task-check";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type TaskRecord,
} from "@/lib/types";

export function TaskTable({
  tasks,
  sort,
  direction,
  onSort,
  onCreate,
}: {
  tasks: TaskRecord[];
  sort: string;
  direction: string;
  onSort: (field: string) => void;
  onCreate: () => void;
}) {
  const columns = [
    { key: "title", label: "Task" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "dueDate", label: "Due date" },
  ];
  return (
    <div className="table-container">
      <table className="task-table">
        <caption className="sr-only">
          Workspace tasks. Select a task title to edit all details.
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  sort === column.key
                    ? direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                <button onClick={() => onSort(column.key)}>
                  {column.label}
                  {sort === column.key ? (
                    direction === "asc" ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )
                  ) : (
                    <ChevronsUpDown size={13} />
                  )}
                </button>
              </th>
            ))}
            <th scope="col">Tags</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow task={task} key={task.id} />
          ))}
        </tbody>
      </table>
      <button className="add-task-row" onClick={onCreate}>
        <Plus size={16} />
        New task
      </button>
      <div className="table-footer">
        {tasks.length} record{tasks.length === 1 ? "" : "s"}
        <span>Click a property to edit</span>
      </div>
    </div>
  );
}
function TaskRow({ task }: { task: TaskRecord }) {
  const { openTask } = useWorkspace();
  const [pending, startTransition] = useTransition();
  function update(data: unknown) {
    startTransition(async () => {
      const result = await updateTaskAction(task.id, data);
      if (!result.ok) toast.error(result.error);
    });
  }
  return (
    <tr className={task.status === "COMPLETED" ? "completed-row" : ""}>
      <td>
        <div className="task-title-cell">
          <TaskCheck task={task} />
          <button className="task-title-button" onClick={() => openTask(task)}>
            {task.title}
          </button>
        </div>
      </td>
      <td>
        <select
          className={`inline-select status-${task.status.toLowerCase()}`}
          aria-label={`Status for ${task.title}`}
          value={task.status}
          disabled={pending}
          onChange={(event) => update({ status: event.target.value })}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <select
          className={`inline-select priority-${task.priority.toLowerCase()}`}
          aria-label={`Priority for ${task.title}`}
          value={task.priority}
          disabled={pending}
          onChange={(event) => update({ priority: event.target.value })}
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="inline-date"
          type="date"
          aria-label={`Due date for ${task.title}`}
          value={task.dueDate ?? ""}
          disabled={pending}
          onChange={(event) => update({ dueDate: event.target.value || null })}
        />
      </td>
      <td>
        <button
          className="table-tags"
          onClick={() => openTask(task)}
          aria-label={`Edit tags for ${task.title}`}
        >
          {task.tags.length ? (
            task.tags.map((tag) => (
              <span key={tag.id} className="tag">
                {tag.name}
              </span>
            ))
          ) : (
            <span className="muted">+ Add tags</span>
          )}
        </button>
      </td>
    </tr>
  );
}
