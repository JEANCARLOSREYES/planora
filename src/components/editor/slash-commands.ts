import type { Editor } from "@tiptap/react";
import {
  AlignLeft,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Minus,
} from "lucide-react";

export const slashCommands = [
  {
    title: "Text",
    description: "A simple paragraph",
    icon: AlignLeft,
    run: (editor: Editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Heading 1",
    description: "A big idea",
    icon: Heading1,
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "A new section",
    icon: Heading2,
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "A little more structure",
    icon: Heading3,
    run: (editor: Editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: "Bulleted List",
    description: "Collect your thoughts",
    icon: List,
    run: (editor: Editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "One step at a time",
    icon: ListOrdered,
    run: (editor: Editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "To-do",
    description: "A checkable list",
    icon: ListTodo,
    run: (editor: Editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Quote",
    description: "Give a thought some room",
    icon: Quote,
    run: (editor: Editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code",
    description: "A formatted code block",
    icon: Code2,
    run: (editor: Editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Create a little separation",
    icon: Minus,
    run: (editor: Editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];
