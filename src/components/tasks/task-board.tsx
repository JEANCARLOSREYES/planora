"use client";
import { useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarDays, GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateTaskAction } from "@/app/actions";
import { useWorkspace } from "@/components/layout/workspace-context";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "./task-badges";
import {
  STATUSES,
  STATUS_LABELS,
  type TaskRecord,
  type TaskStatus,
} from "@/lib/types";
import { dateLabel } from "@/lib/utils";

export function TaskBoard({
  tasks,
  onCreate,
}: {
  tasks: TaskRecord[];
  onCreate: (status: TaskStatus) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimisticTasks, moveTask] = useOptimistic(
    tasks,
    (current, change: { id: string; status: TaskStatus }) =>
      current.map((task) =>
        task.id === change.id ? { ...task, status: change.status } : task,
      ),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );
  const active = tasks.find((task) => task.id === activeId);
  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over) return;
    const status = event.over.id as TaskStatus;
    const task = tasks.find((item) => item.id === event.active.id);
    if (!task || !STATUSES.includes(status) || task.status === status) return;
    startTransition(async () => {
      moveTask({ id: task.id, status });
      const result = await updateTaskAction(task.id, { status });
      if (!result.ok) toast.error(result.error);
      else toast.success(`Moved to ${STATUS_LABELS[status]}`);
    });
  }
  return (
    <DndContext
      id="task-board"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="task-board">
        {STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={optimisticTasks.filter((task) => task.status === status)}
            onCreate={() => onCreate(status)}
            disabled={pending}
          />
        ))}
      </div>
      <DragOverlay>
        {active && (
          <div className="board-card drag-overlay-card">
            <CardContents task={active} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
function BoardColumn({
  status,
  tasks,
  onCreate,
  disabled,
}: {
  status: TaskStatus;
  tasks: TaskRecord[];
  onCreate: () => void;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`board-column ${isOver ? "drag-over" : ""}`}
      aria-label={STATUS_LABELS[status]}
    >
      <header>
        <StatusBadge status={status} />
        <span className="subtle-count">{tasks.length}</span>
        <Button
          className="ml-auto"
          size="icon"
          variant="ghost"
          aria-label={`Add ${STATUS_LABELS[status]} task`}
          onClick={onCreate}
        >
          <Plus size={16} />
        </Button>
      </header>
      <div className="board-cards">
        {tasks.map((task) => (
          <BoardCard key={task.id} task={task} disabled={disabled} />
        ))}
        {!tasks.length && (
          <div className="board-empty">
            A little room for what’s next.
            <span>Drop a task here or add one below.</span>
          </div>
        )}
      </div>
      <button className="add-task-row" onClick={onCreate}>
        <Plus size={16} />
        Add task
      </button>
    </section>
  );
}
function BoardCard({
  task,
  disabled,
}: {
  task: TaskRecord;
  disabled: boolean;
}) {
  const { openTask } = useWorkspace();
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: task.id,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={`board-card ${isDragging ? "dragging" : ""}`}
    >
      <button
        className="board-card-drag"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${task.title}`}
        title="Drag task"
      >
        <GripVertical size={16} />
      </button>
      <button
        className="board-card-open"
        onClick={() => openTask(task)}
        aria-label={`Edit ${task.title}`}
      >
        <CardContents task={task} />
      </button>
    </div>
  );
}
function CardContents({ task }: { task: TaskRecord }) {
  return (
    <>
      <PriorityBadge priority={task.priority} />
      <h3>{task.title}</h3>
      {task.description && (
        <p className="board-description">{task.description}</p>
      )}
      <div className="board-tags">
        {task.tags.map((tag) => (
          <span key={tag.id} className="tag">
            {tag.name}
          </span>
        ))}
      </div>
      <div className="board-card-footer">
        <CalendarDays size={13} />
        {dateLabel(task.dueDate)}
        {task.status === "COMPLETED" && <span className="ml-auto">✓ Done</span>}
      </div>
    </>
  );
}
