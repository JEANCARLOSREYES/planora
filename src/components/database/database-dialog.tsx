"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createDatabaseAction, updateDatabaseAction } from "@/app/actions";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { DatabaseSummary } from "@/lib/types";
export function DatabaseDialog({
  database,
  onClose,
}: {
  database?: DatabaseSummary;
  onClose: () => void;
}) {
  const [name, setName] = useState(database?.name ?? "");
  const [description, setDescription] = useState(database?.description ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      title={database ? "Edit database" : "Create a database"}
      description="A focused collection of tasks with table, board, and calendar views."
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = database
              ? await updateDatabaseAction(database.id, { name, description })
              : await createDatabaseAction({ name, description });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            onClose();
            toast.success(database ? "Database updated" : "Database created");
            if (result.data)
              router.push(`/workspace/database/${result.data.id}`);
            router.refresh();
          });
        }}
      >
        <label>
          Name
          <input
            autoFocus
            required
            maxLength={100}
            placeholder="e.g. Product launch"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            maxLength={500}
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What will you organize here?"
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <Button disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending
              ? "Saving…"
              : database
                ? "Save changes"
                : "Create database"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
