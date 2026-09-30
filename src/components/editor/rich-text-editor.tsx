"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import DragHandle from "@tiptap/extension-drag-handle-react";
import { GripVertical, RotateCw } from "lucide-react";
import { usePageAutosave } from "@/hooks/use-page-autosave";
import { useWorkspace } from "@/components/layout/workspace-context";
import { EditorToolbar } from "./editor-toolbar";
import { slashCommands } from "./slash-commands";
import { Button } from "@/components/ui/button";
import { safeLink } from "@/lib/validation";
import type { EditorNode } from "@/lib/types";

type Slash = {
  query: string;
  from: number;
  to: number;
  top: number;
  left: number;
  selected: number;
};
export function RichTextEditor({
  pageId,
  initialContent,
  revision,
}: {
  pageId: string;
  initialContent: EditorNode;
  revision: number;
}) {
  const autosave = usePageAutosave(pageId, revision, initialContent);
  const { setSaveStatus } = useWorkspace();
  const [slash, setSlash] = useState<Slash | null>(null);
  const slashRef = useRef<Slash | null>(null);
  const editorRef = useRef<Editor | null>(null);
  function updateSlash(value: Slash | null) {
    slashRef.current = value;
    setSlash(value);
  }
  const detectSlash = useCallback(({ editor }: { editor: Editor }) => {
    const { $from, empty } = editor.state.selection;
    const text = $from.parent.textBetween(0, $from.parentOffset);
    if (
      !empty ||
      !text.startsWith("/") ||
      text.length > 32 ||
      editor.isActive("codeBlock")
    ) {
      updateSlash(null);
      return;
    }
    const coords = editor.view.coordsAtPos($from.pos);
    updateSlash({
      query: text.slice(1).toLowerCase(),
      from: $from.start(),
      to: $from.pos,
      top: Math.min(coords.bottom + 8, window.innerHeight - 350),
      left: Math.min(coords.left, window.innerWidth - 300),
      selected:
        slashRef.current?.query === text.slice(1).toLowerCase()
          ? slashRef.current.selected
          : 0,
    });
  }, []);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          isAllowedUri: (url) => safeLink(url),
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: "Let your thoughts take shape. Type / for blocks…",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "planora-editor",
        "aria-label": "Page content",
        role: "textbox",
        "aria-multiline": "true",
      },
      handleKeyDown: (_view, event) => {
        const menu = slashRef.current;
        if (!menu) return false;
        const commands = slashCommands.filter((command) =>
          command.title.toLowerCase().includes(menu.query),
        );
        if (event.key === "Escape") {
          event.preventDefault();
          updateSlash(null);
          return true;
        }
        if (!commands.length) return false;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          updateSlash({
            ...menu,
            selected:
              (menu.selected +
                (event.key === "ArrowDown" ? 1 : -1) +
                commands.length) %
              commands.length,
          });
          return true;
        }
        if (event.key === "Enter") {
          event.preventDefault();
          const current = editorRef.current;
          if (current) {
            current
              .chain()
              .focus()
              .deleteRange({ from: menu.from, to: menu.to })
              .run();
            commands[menu.selected % commands.length].run(current);
            updateSlash(null);
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      autosave.change(editor.getJSON() as EditorNode);
      detectSlash({ editor });
    },
    onSelectionUpdate: detectSlash,
  });
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);
  useEffect(() => {
    setSaveStatus(autosave.status);
  }, [autosave.status, setSaveStatus]);
  useEffect(() => {
    if (!slash) return;
    document
      .getElementById(`slash-item-${slash.selected}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [slash]);
  if (!editor)
    return <div className="skeleton h-64" aria-label="Loading editor" />;
  const filtered = slash
    ? slashCommands.filter((command) =>
        command.title.toLowerCase().includes(slash.query),
      )
    : [];
  return (
    <div className="editor-container">
      {autosave.recovery && (
        <div className="editor-notice">
          <p>
            A draft from an earlier session is available. Restore it to replace
            the currently saved content.
          </p>
          <div>
            <Button
              size="sm"
              onClick={() => {
                if (autosave.recovery) {
                  editor.commands.setContent(autosave.recovery.content);
                  autosave.change(autosave.recovery.content);
                  autosave.acceptRecovery();
                }
              }}
            >
              Restore draft
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={autosave.discardRecovery}
            >
              Keep saved version
            </Button>
          </div>
        </div>
      )}
      {autosave.error && (
        <div className="editor-notice error-notice" role="alert">
          <p>{autosave.error}</p>
          <Button
            size="sm"
            onClick={() =>
              autosave.status === "Save conflict"
                ? window.location.reload()
                : void autosave.flush()
            }
          >
            <RotateCw size={14} />
            {autosave.status === "Save conflict"
              ? "Reload to compare"
              : "Retry save"}
          </Button>
        </div>
      )}
      <EditorToolbar editor={editor} />
      <div className="editor-writing-surface">
        <DragHandle editor={editor}>
          <button
            className="editor-drag-handle"
            aria-label="Drag to reorder block"
            title="Drag block. You can also use the toolbar arrows."
          >
            <GripVertical size={18} />
          </button>
        </DragHandle>
        <EditorContent editor={editor} />
      </div>
      {slash && (
        <div
          className="slash-menu"
          role="listbox"
          aria-label="Block commands"
          style={{
            top: Math.max(80, slash.top),
            left: Math.max(12, slash.left),
          }}
        >
          <div className="slash-menu-label">ADD A BLOCK</div>
          {filtered.map((command, index) => (
            <button
              key={command.title}
              id={`slash-item-${index}`}
              type="button"
              role="option"
              aria-selected={slash.selected === index}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .deleteRange({ from: slash.from, to: slash.to })
                  .run();
                command.run(editor);
                updateSlash(null);
              }}
            >
              <span>
                <command.icon size={19} />
              </span>
              <span>
                <strong>{command.title}</strong>
                <small>{command.description}</small>
              </span>
            </button>
          ))}
          {!filtered.length && (
            <p className="p-4 text-sm muted">No matching blocks.</p>
          )}
          <div className="slash-menu-footer">
            ↑↓ Navigate · Enter to insert · Esc to close
          </div>
        </div>
      )}
      <div className="editor-footer">
        <span>
          Type <kbd>/</kbd> for blocks · Drag a handle to rearrange
        </span>
        <span>
          {autosave.status === "Saved"
            ? "Saved to your workspace"
            : autosave.status}
        </span>
      </div>
    </div>
  );
}
