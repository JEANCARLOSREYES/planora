"use client";
import { useState } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Undo2,
  Redo2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Fragment } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { safeLink } from "@/lib/validation";

export function EditorToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      bulletList: editor.isActive("bulletList"),
      orderedList: editor.isActive("orderedList"),
      taskList: editor.isActive("taskList"),
      blockquote: editor.isActive("blockquote"),
      heading: editor.getAttributes("heading").level ?? 0,
      undo: editor.can().undo(),
      redo: editor.can().redo(),
      canMoveUp: editor.state.selection.$from.index(0) > 0,
      canMoveDown:
        editor.state.selection.$from.index(0) < editor.state.doc.childCount - 1,
    }),
  });
  const buttons = [
    {
      label: "Bold (⌘/Ctrl+B)",
      icon: Bold,
      active: active.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic (⌘/Ctrl+I)",
      icon: Italic,
      active: active.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline (⌘/Ctrl+U)",
      icon: Underline,
      active: active.underline,
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Strikethrough",
      icon: Strikethrough,
      active: active.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Inline code",
      icon: Code,
      active: active.code,
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: "Bulleted list",
      icon: List,
      active: active.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      active: active.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Task list",
      icon: ListTodo,
      active: active.taskList,
      run: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      label: "Blockquote",
      icon: Quote,
      active: active.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];
  function moveBlock(direction: number) {
    const { state, view } = editor;
    const index = state.selection.$from.index(0);
    const blocks = Array.from({ length: state.doc.childCount }, (_, position) =>
      state.doc.child(position),
    );
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    const transaction = state.tr.replaceWith(
      0,
      state.doc.content.size,
      Fragment.fromArray(blocks),
    );
    const position = blocks
      .slice(0, target)
      .reduce((total, node) => total + node.nodeSize, 0);
    transaction.setSelection(
      TextSelection.near(
        transaction.doc.resolve(
          Math.min(position + 1, transaction.doc.content.size),
        ),
      ),
    );
    view.dispatch(transaction);
    editor.commands.focus();
  }
  return (
    <>
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        <select
          className="block-select"
          aria-label="Block type"
          value={String(active.heading)}
          onChange={(event) => {
            const level = Number(event.target.value);
            if (level)
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run();
            else editor.chain().focus().setParagraph().run();
          }}
        >
          <option value="0">Text</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
        <span className="toolbar-separator" />
        {buttons.map((button) => (
          <button
            type="button"
            key={button.label}
            title={button.label}
            aria-label={button.label}
            aria-pressed={button.active}
            onClick={button.run}
          >
            <button.icon size={16} />
          </button>
        ))}
        <button
          type="button"
          aria-label="Add or edit link"
          title="Add or edit link"
          onClick={() => {
            setUrl(editor.getAttributes("link").href ?? "");
            setError("");
            setLinkOpen(true);
          }}
        >
          <Link2 size={16} />
        </button>
        <span className="toolbar-separator" />
        <button
          type="button"
          aria-label="Move block up"
          title="Move block up"
          disabled={!active.canMoveUp}
          onClick={() => moveBlock(-1)}
        >
          <ArrowUp size={16} />
        </button>
        <button
          type="button"
          aria-label="Move block down"
          title="Move block down"
          disabled={!active.canMoveDown}
          onClick={() => moveBlock(1)}
        >
          <ArrowDown size={16} />
        </button>
        <span className="toolbar-separator" />
        <button
          type="button"
          aria-label="Undo"
          title="Undo"
          disabled={!active.undo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          aria-label="Redo"
          title="Redo"
          disabled={!active.redo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </button>
      </div>
      <Dialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        title="Add a link"
        description="Link to a website or email address. Leave the field empty to remove an existing link."
      >
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            if (url && !safeLink(url)) {
              setError("Use a complete https://, http://, or mailto: link.");
              return;
            }
            if (url)
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({
                  href: url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                })
                .run();
            else
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            setLinkOpen(false);
          }}
        >
          <label>
            Link URL
            <input
              autoFocus
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            <Button onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">
              {url ? "Save link" : "Remove link"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
