import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import type { EditorNode } from "@/lib/types";
import { WorkspaceError } from "./errors";

const schema = getSchema([
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  TaskList,
  TaskItem.configure({ nested: true }),
]);
export function validateEditorStructure(content: EditorNode) {
  try {
    schema.nodeFromJSON(content).check();
  } catch {
    throw new WorkspaceError(
      "This content has an invalid block structure. Copy your text into a new page or restore a valid draft.",
      400,
    );
  }
}
