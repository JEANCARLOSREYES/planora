"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { Plus, ArrowRight, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { updatePageAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/layout/workspace-context";
import type { PageSummary, EditorNode } from "@/lib/types";

const RichTextEditor = dynamic(
  () =>
    import("@/components/editor/rich-text-editor").then(
      (module) => module.RichTextEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="skeleton h-64" aria-label="Loading editor" />
    ),
  },
);
export function PageDocument({
  page,
  content,
  revision,
}: {
  page: PageSummary;
  content: EditorNode;
  revision: number;
}) {
  const { pages, openPage } = useWorkspace();
  const children = pages.filter((child) => child.parentId === page.id);
  return (
    <article className="document-page">
      {page.cover && (
        <div className={`document-cover cover-${page.cover}`}>
          <span className="cover-ring" />
          <span className="cover-ring second" />
          <div>SPACE FOR YOUR NEXT CHAPTER</div>
        </div>
      )}
      <div className="document-body">
        <div className={`document-icon ${page.cover ? "with-cover" : ""}`}>
          {page.icon}
        </div>
        <EditableTitle key={page.title} page={page} />
        <div className="document-meta">
          <Clock3 size={13} />
          Created {format(new Date(page.createdAt), "MMM d, yyyy")}
          <span>·</span>Edited{" "}
          {format(new Date(page.updatedAt), "MMM d, h:mm a")}
        </div>
        {children.length > 0 && (
          <div className="nested-pages">
            {children.map((child) => (
              <Link href={`/workspace/page/${child.id}`} key={child.id}>
                <span>{child.icon}</span>
                {child.title}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        )}
        <RichTextEditor
          key={page.id}
          pageId={page.id}
          initialContent={content}
          revision={revision}
        />
        <Button
          variant="ghost"
          size="sm"
          className="mt-5"
          onClick={() => openPage(page.id)}
        >
          <Plus size={15} />
          Add a nested page
        </Button>
      </div>
    </article>
  );
}

function EditableTitle({ page }: { page: PageSummary }) {
  const [title, setTitle] = useState(page.title);
  const [pending, startTransition] = useTransition();
  function saveTitle() {
    if (title.trim() === page.title) return;
    startTransition(async () => {
      const result = await updatePageAction(page.id, { title });
      if (!result.ok) {
        toast.error(result.error);
        setTitle(page.title);
      }
    });
  }
  return (
    <input
      className="document-title"
      aria-label="Page title"
      maxLength={160}
      value={title}
      onChange={(event) => setTitle(event.target.value)}
      onBlur={saveTitle}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      disabled={pending}
    />
  );
}
