"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
} from "@/app/actions";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type DatabaseSummary,
  type TaskRecord,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

export function TaskDialog({
  task,
  defaults,
  databases,
  onClose,
}: {
  task?: TaskRecord;
  defaults?: { dueDate?: string; status?: TaskStatus; databaseId?: string };
  databases: DatabaseSummary[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(
    task?.status ?? defaults?.status ?? "NOT_STARTED",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? "MEDIUM",
  );
  const [dueDate, setDueDate] = useState(
    task?.dueDate ?? defaults?.dueDate ?? "",
  );
  const [tags, setTags] = useState(
    task?.tags.map((tag) => tag.name).join(", ") ?? "",
  );
  const [databaseId, setDatabase] = useState(
    task?.databaseId ?? defaults?.databaseId ?? "",
  );
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  function remove() {
    if (!task) return;
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Task deleted");
      onClose();
      router.refresh();
    });
  }
  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => !open && !pending && onClose()}
        title={task ? "Task details" : "One step closer"}
        description={
          task
            ? "Keep the details clear and the next step simple."
            : "A little intention goes a long way. What’s next?"
        }
      >
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            startTransition(async () => {
              const data = {
                title,
                description,
                status,
                priority,
                dueDate: dueDate || null,
                databaseId: databaseId || null,
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              };
              const result = await (task
                ? updateTaskAction(task.id, data)
                : createTaskAction(data));
              if (!result.ok) {
                setError(result.error);
                return;
              }
              toast.success(task ? "Task updated" : "Task created");
              onClose();
              router.refresh();
            });
          }}
        >
          <label>
            Task title
            <input
              autoFocus
              required
              maxLength={200}
              placeholder="What would you like to get done?"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              maxLength={10000}
              placeholder="Add a little context…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as TaskStatus)
                }
              >
                {STATUSES.map((value) => (
                  <option value={value} key={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as TaskPriority)
                }
              >
                {PRIORITIES.map((value) => (
                  <option value={value} key={value}>
                    {PRIORITY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
            <label>
              Database
              <select
                value={databaseId}
                onChange={(event) => setDatabase(event.target.value)}
              >
                <option value="">General tasks</option>
                {databases.map((database) => (
                  <option key={database.id} value={database.id}>
                    {database.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Tags
            <span className="field-hint">Separate with commas · up to 8</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="work, personal, university"
            />
          </label>
          {task && (
            <p className="metadata">
              Created {format(new Date(task.createdAt), "MMM d, yyyy")} ·
              Updated {format(new Date(task.updatedAt), "MMM d, h:mm a")}
            </p>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            {task && (
              <Button
                variant="ghost"
                size="icon"
                className="danger-text mr-auto"
                aria-label="Delete task"
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                <Trash2 size={17} />
              </Button>
            )}
            <Button disabled={pending} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this task?"
        description="This permanently removes the task from every view. This action cannot be undone."
        pending={pending}
        onConfirm={remove}
      />
    </>
  );
}
