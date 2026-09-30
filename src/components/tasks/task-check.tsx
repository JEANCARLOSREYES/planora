"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, LoaderCircle } from "lucide-react";
import { updateTaskAction } from "@/app/actions";
import type { TaskRecord } from "@/lib/types";
export function TaskCheck({
  task,
}: {
  task: Pick<TaskRecord, "id" | "title" | "status">;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className={`task-check ${task.status === "COMPLETED" ? "checked" : ""}`}
      role="checkbox"
      aria-checked={task.status === "COMPLETED"}
      aria-label={`Mark ${task.title} ${task.status === "COMPLETED" ? "incomplete" : "complete"}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const completed = task.status !== "COMPLETED";
          const result = await updateTaskAction(task.id, {
            status: completed ? "COMPLETED" : "NOT_STARTED",
          });
          if (!result.ok) toast.error(result.error);
          else
            toast.success(
              completed ? "Task completed. Nice work!" : "Task reopened",
            );
        })
      }
    >
      {pending ? (
        <LoaderCircle size={12} className="animate-spin" />
      ) : (
        task.status === "COMPLETED" && <Check size={13} />
      )}
    </button>
  );
}
