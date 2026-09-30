"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Copy,
  FilePlus2,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import {
  updatePageAction,
  deletePageAction,
  duplicatePageAction,
} from "@/app/actions";
import { useWorkspace } from "@/components/layout/workspace-context";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { descendantIds } from "@/lib/hierarchy";
import { covers } from "@/lib/validation";
import type { PageSummary } from "@/lib/types";

export function PageActions({ page }: { page: PageSummary }) {
  const { pages, openPage } = useWorkspace();
  const router = useRouter();
  const [properties, setProperties] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, startTransition] = useTransition();
  const descendants = descendantIds(pages, page.id);
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        aria-label={
          page.favorite ? "Remove from favorites" : "Add to favorites"
        }
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updatePageAction(page.id, {
              favorite: !page.favorite,
            });
            if (!result.ok) toast.error(result.error);
          })
        }
      >
        <Star size={18} className={page.favorite ? "favorite-star" : ""} />
      </Button>
      <Menu
        trigger={
          <Button
            size="icon"
            variant="ghost"
            aria-label="Page actions"
            disabled={pending}
          >
            <MoreHorizontal size={21} />
          </Button>
        }
      >
        <MenuItem onSelect={() => setProperties(true)}>
          <Pencil size={16} /> Page properties
        </MenuItem>
        <MenuItem onSelect={() => openPage(page.id)}>
          <FilePlus2 size={16} /> Add nested page
        </MenuItem>
        <MenuItem onSelect={() => setProperties(true)}>
          <FolderInput size={16} /> Move to…
        </MenuItem>
        <MenuItem
          onSelect={() =>
            startTransition(async () => {
              const result = await duplicatePageAction(page.id);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Page duplicated");
              router.push(`/workspace/page/${result.data.id}`);
            })
          }
        >
          <Copy size={16} /> Duplicate page
        </MenuItem>
        <MenuSeparator />
        <MenuItem danger onSelect={() => setDeleting(true)}>
          <Trash2 size={16} /> Delete page
        </MenuItem>
      </Menu>
      {properties && (
        <PageProperties page={page} onClose={() => setProperties(false)} />
      )}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${page.title}”?`}
        description={`This permanently removes this page${descendants.length ? ` and its ${descendants.length} nested page${descendants.length > 1 ? "s" : ""}` : ""}. This action cannot be undone.`}
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deletePageAction(page.id);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Page deleted");
            setDeleting(false);
            router.push("/workspace");
          })
        }
      />
    </>
  );
}
function PageProperties({
  page,
  onClose,
}: {
  page: PageSummary;
  onClose: () => void;
}) {
  const { pages } = useWorkspace();
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon);
  const [cover, setCover] = useState(page.cover ?? "");
  const [parent, setParent] = useState(page.parentId ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const excluded = new Set([page.id, ...descendantIds(pages, page.id)]);
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      title="Page properties"
      description="Make this corner of your workspace your own."
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await updatePageAction(page.id, {
              title,
              icon,
              cover: cover || null,
              parentId: parent || null,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            toast.success("Page updated");
            onClose();
          });
        }}
      >
        <label>
          Title
          <input
            required
            maxLength={160}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Page icon
          <input
            required
            maxLength={16}
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
          />
        </label>
        <div className="emoji-picker" aria-label="Suggested icons">
          {[
            "📄",
            "🎓",
            "💡",
            "🌱",
            "🚀",
            "🗓️",
            "💬",
            "📚",
            "🎯",
            "✨",
            "🎨",
            "🏡",
          ].map((emoji) => (
            <button
              type="button"
              key={emoji}
              onClick={() => setIcon(emoji)}
              aria-label={`Use ${emoji}`}
              aria-pressed={icon === emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        <label>
          Visual header
          <select
            value={cover}
            onChange={(event) => setCover(event.target.value)}
          >
            <option value="">No cover</option>
            {covers.map((value) => (
              <option value={value} key={value}>
                {value[0].toUpperCase() + value.slice(1)}
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
            {pages
              .filter((item) => !excluded.has(item.id))
              .map((item) => (
                <option value={item.id} key={item.id}>
                  {item.icon} {item.title}
                </option>
              ))}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
