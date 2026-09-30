"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPageAction } from "@/app/actions";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { templates } from "@/lib/templates";
import type { PageSummary } from "@/lib/types";

export function CreatePageDialog({
  onClose,
  pages,
  parentId,
  template = "blank",
}: {
  onClose: () => void;
  pages: PageSummary[];
  parentId?: string | null;
  template?: string;
}) {
  const router = useRouter();
  const initial =
    templates.find((item) => item.id === template) ?? templates[0];
  const [title, setTitle] = useState(
    initial.id === "blank" ? "" : initial.name,
  );
  const [selectedTemplate, setTemplate] = useState(initial.id as string);
  const [parent, setParent] = useState(parentId ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      title="A fresh page"
      description="Give your next idea a place to grow."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await createPageAction({
              title,
              parentId: parent || null,
              template: selectedTemplate,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            toast.success("Page created");
            onClose();
            router.push(`/workspace/page/${result.data.id}`);
          });
        }}
        className="form-stack"
      >
        <label>
          Page title
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            required
            placeholder="What’s on your mind?"
          />
        </label>
        <label>
          Start with
          <select
            value={selectedTemplate}
            onChange={(event) => {
              setTemplate(event.target.value);
              if (!title)
                setTitle(
                  templates.find((item) => item.id === event.target.value)
                    ?.name ?? "",
                );
            }}
          >
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.icon} {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Location
          <select
            value={parent}
            onChange={(event) => setParent(event.target.value)}
          >
            <option value="">Workspace — top level</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.icon} {page.title}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Create page"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
