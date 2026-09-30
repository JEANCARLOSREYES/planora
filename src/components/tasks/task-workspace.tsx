"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Columns3,
  Table2,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowDownUp,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteDatabaseAction } from "@/app/actions";
import { useWorkspace } from "@/components/layout/workspace-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu, MenuItem } from "@/components/ui/menu";
import { ConfirmDialog } from "@/components/ui/dialog";
import { DatabaseDialog } from "@/components/database/database-dialog";
import { TaskTable } from "./task-table";
import { TaskBoard } from "./task-board";
import { TaskCalendar } from "./task-calendar";
import { filterTasks } from "@/lib/task-filters";
import { todayKey } from "@/lib/utils";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type DatabaseSummary,
  type TaskRecord,
} from "@/lib/types";

export function TaskWorkspace({
  tasks,
  initialView = "table",
  database,
}: {
  tasks: TaskRecord[];
  initialView?: "table" | "calendar";
  database?: DatabaseSummary;
}) {
  const { openTask } = useWorkspace();
  const params = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<string>(initialView);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [tag, setTag] = useState(params.get("tag") ?? "");
  const [due, setDue] = useState(params.get("due") ?? "");
  const [sort, setSort] = useState("createdAt");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [filtersOpen, setFiltersOpen] = useState(Boolean(tag || due));
  const [editingDatabase, setEditingDatabase] = useState(false);
  const [deletingDatabase, setDeletingDatabase] = useState(false);
  const [pending, startTransition] = useTransition();
  const selectedTask = params.get("task");
  const openedTask = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedTask) openedTask.current = null;
    if (selectedTask && openedTask.current !== selectedTask) {
      const task = tasks.find((item) => item.id === selectedTask);
      if (task) {
        openTask(task);
        openedTask.current = selectedTask;
      }
    }
  }, [selectedTask, tasks, openTask]);
  const filteredTasks = useMemo(
    () =>
      filterTasks(tasks, {
        query,
        status,
        priority,
        tag,
        due,
        sort,
        direction,
        today: todayKey(),
      }),
    [tasks, query, status, priority, tag, due, sort, direction],
  );
  const tags = [
    ...new Set(tasks.flatMap((task) => task.tags.map((tag) => tag.name))),
  ].sort();
  const activeFilters = [status, priority, tag, due].filter(Boolean).length;
  function clearFilters() {
    setQuery("");
    setStatus("");
    setPriority("");
    setTag("");
    setDue("");
  }
  function onSort(field: string) {
    if (sort === field) setDirection(direction === "asc" ? "desc" : "asc");
    else {
      setSort(field);
      setDirection("asc");
    }
  }
  const title =
    database?.name ??
    (initialView === "calendar"
      ? "A little more perspective."
      : "Small steps. Big things.");
  return (
    <div className="content-wrap tasks-workspace">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="accent-dot" />
            {database
              ? "YOUR DATABASE"
              : initialView === "calendar"
                ? "YOUR CALENDAR"
                : "YOUR TASKS"}
          </div>
          <h1>{title}</h1>
          <p>
            {database?.description ||
              (initialView === "calendar"
                ? "Make space for your plans. See the days ahead."
                : "A clear view of what’s next, and the progress you’re making.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => openTask(undefined, { databaseId: database?.id })}
          >
            <Plus size={17} />
            New task
          </Button>
          {database && (
            <Menu
              trigger={
                <Button size="icon" aria-label="Database actions">
                  <MoreHorizontal size={18} />
                </Button>
              }
            >
              <MenuItem onSelect={() => setEditingDatabase(true)}>
                <Pencil size={16} />
                Edit database
              </MenuItem>
              <MenuItem danger onSelect={() => setDeletingDatabase(true)}>
                <Trash2 size={16} />
                Delete database
              </MenuItem>
            </Menu>
          )}
        </div>
      </div>
      <div className="task-summary-strip">
        <span>
          <span className="summary-dot" />
          {tasks.filter((task) => task.status === "NOT_STARTED").length} to
          start
        </span>
        <span>
          <span className="summary-dot in-progress" />
          {tasks.filter((task) => task.status === "IN_PROGRESS").length} in
          progress
        </span>
        <span>
          <span className="summary-dot completed" />
          {tasks.filter((task) => task.status === "COMPLETED").length} completed
        </span>
      </div>
      <div className="view-toolbar">
        <div className="view-tabs" role="tablist" aria-label="Task view">
          {[
            { id: "table", label: "Table", icon: Table2 },
            { id: "board", label: "Board", icon: Columns3 },
            { id: "calendar", label: "Calendar", icon: CalendarDays },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls="task-view-panel"
              aria-selected={view === tab.id}
              tabIndex={view === tab.id ? 0 : -1}
              onClick={() => setView(tab.id)}
              onKeyDown={(event) => {
                const order = ["table", "board", "calendar"];
                if (
                  ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const index = order.indexOf(view);
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? 2
                        : (index + (event.key === "ArrowRight" ? 1 : -1) + 3) %
                          3;
                  setView(order[next]);
                  document.getElementById(`tab-${order[next]}`)?.focus();
                }
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="view-tools">
          <div className="task-search">
            <Search size={15} />
            <input
              aria-label="Search tasks"
              placeholder="Search tasks…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant={filtersOpen ? "secondary" : "ghost"}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={15} />
            Filter
            {activeFilters > 0 && (
              <span className="subtle-count">{activeFilters}</span>
            )}
          </Button>
          <Menu
            trigger={
              <Button size="sm" variant="ghost">
                <ArrowDownUp size={15} />
                Sort
              </Button>
            }
          >
            {[
              { key: "createdAt", label: "Newest first" },
              { key: "title", label: "Task title" },
              { key: "priority", label: "Priority" },
              { key: "status", label: "Status" },
              { key: "dueDate", label: "Due date" },
            ].map((option) => (
              <MenuItem key={option.key} onSelect={() => onSort(option.key)}>
                {option.label}
                {sort === option.key && (
                  <span className="ml-auto">
                    {direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </div>
      {filtersOpen && (
        <div className="filter-panel">
          <label>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tag
            <select
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              <option value="">All tags</option>
              {tags.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <select
              value={due}
              onChange={(event) => setDue(event.target.value)}
            >
              <option value="">Any date</option>
              <option value="today">Due today</option>
              <option value="overdue">Overdue</option>
              <option value="undated">No due date</option>
            </select>
          </label>
          {activeFilters > 0 && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              <X size={14} />
              Clear
            </Button>
          )}
        </div>
      )}
      <div
        role="tabpanel"
        id="task-view-panel"
        aria-labelledby={`tab-${view}`}
        className="task-view-panel"
      >
        {!filteredTasks.length && view !== "calendar" && view !== "board" ? (
          <div className="empty-task-panel">
            <EmptyState
              title={
                tasks.length ? "No matching tasks." : "You’re all caught up."
              }
              description={
                tasks.length
                  ? "Try a different search or make a little more room in your filters."
                  : "Give your next step a place to land."
              }
              action={
                <Button
                  onClick={
                    tasks.length
                      ? clearFilters
                      : () => openTask(undefined, { databaseId: database?.id })
                  }
                  variant="primary"
                >
                  {tasks.length ? "Clear filters" : "Create your first task"}
                </Button>
              }
            />
          </div>
        ) : view === "table" ? (
          <TaskTable
            tasks={filteredTasks}
            sort={sort}
            direction={direction}
            onSort={onSort}
            onCreate={() => openTask(undefined, { databaseId: database?.id })}
          />
        ) : view === "board" ? (
          <TaskBoard
            tasks={filteredTasks}
            onCreate={(status) =>
              openTask(undefined, { status, databaseId: database?.id })
            }
          />
        ) : (
          <TaskCalendar
            tasks={filteredTasks}
            onCreate={(dueDate) =>
              openTask(undefined, { dueDate, databaseId: database?.id })
            }
          />
        )}
      </div>
      {editingDatabase && (
        <DatabaseDialog
          database={database}
          onClose={() => setEditingDatabase(false)}
        />
      )}
      <ConfirmDialog
        open={deletingDatabase}
        onOpenChange={setDeletingDatabase}
        title="Delete this database?"
        description="The collection will be removed. Its tasks will stay in your workspace as general tasks."
        pending={pending}
        onConfirm={() => {
          if (!database) return;
          startTransition(async () => {
            const result = await deleteDatabaseAction(database.id);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Database deleted. Your tasks are kept.");
            router.push("/workspace/tasks");
          });
        }}
      />
    </div>
  );
}
