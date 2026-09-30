import { z } from "zod";
import { PRIORITIES, STATUSES, type EditorNode } from "./types";

const id = z.string().min(1).max(100);
export const covers = ["indigo", "ocean", "sunrise", "forest", "rose"] as const;
export const pageCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Give your page a title.").max(160),
    parentId: id.nullable().optional(),
    template: z
      .enum(["blank", "weekly", "meeting", "project", "study"])
      .optional(),
  })
  .strict();
export const pageUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Give your page a title.")
      .max(160)
      .optional(),
    icon: z.string().trim().min(1).max(16).optional(),
    cover: z.enum(covers).nullable().optional(),
    favorite: z.boolean().optional(),
    parentId: id.nullable().optional(),
  })
  .strict();
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
    );
  }, "Choose a valid date.");
const tagsSchema = z
  .array(z.string().trim().min(1).max(30))
  .max(8)
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]);
export const taskCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Give your task a title.").max(200),
    description: z.string().max(10000).default(""),
    status: z.enum(STATUSES).default("NOT_STARTED"),
    priority: z.enum(PRIORITIES).default("MEDIUM"),
    dueDate: dateSchema.nullable().default(null),
    tags: tagsSchema.default([]),
    databaseId: id.nullable().default(null),
  })
  .strict();
// Updates must not inherit creation defaults: omitted fields must stay unchanged.
export const taskUpdateSchema = z
  .object({
    title: taskCreateSchema.shape.title.optional(),
    description: z.string().max(10000).optional(),
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    dueDate: dateSchema.nullable().optional(),
    tags: tagsSchema.optional(),
    databaseId: id.nullable().optional(),
  })
  .strict();
export const databaseSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).default(""),
  })
  .strict();
export const workspaceSchema = z
  .object({ name: z.string().trim().min(1, "Enter a workspace name.").max(80) })
  .strict();
export const reorderSchema = z
  .object({ parentId: id.nullable(), ids: z.array(id).max(1000) })
  .strict();

const nodeTypes = new Set([
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "taskList",
  "taskItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
]);
const markTypes = new Set([
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "link",
]);
export function safeLink(value: string) {
  try {
    return ["https:", "http:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
function validNode(value: unknown, depth = 0): value is EditorNode {
  if (!value || typeof value !== "object" || depth > 30) return false;
  const node = value as EditorNode;
  if (
    !nodeTypes.has(node.type) ||
    (node.text !== undefined && typeof node.text !== "string")
  )
    return false;
  if (node.type === "heading" && ![1, 2, 3].includes(Number(node.attrs?.level)))
    return false;
  if (
    node.marks &&
    (!Array.isArray(node.marks) ||
      node.marks.some(
        (mark) =>
          !mark ||
          typeof mark !== "object" ||
          !markTypes.has(mark.type) ||
          (mark.type === "link" && !safeLink(String(mark.attrs?.href))),
      ))
  )
    return false;
  return (
    node.content === undefined ||
    (Array.isArray(node.content) &&
      node.content.every((child) => validNode(child, depth + 1)))
  );
}
export const contentSchema = z.custom<EditorNode>(
  (value) =>
    validNode(value) &&
    value.type === "doc" &&
    JSON.stringify(value).length <= 500_000,
  "This page contains unsupported or too much content.",
);
export const editorSaveSchema = z
  .object({ content: contentSchema, revision: z.number().int().nonnegative() })
  .strict();
export function extractText(node: EditorNode): string {
  return (
    node.text ??
    node.content
      ?.map(extractText)
      .join(node.type === "paragraph" || node.type === "heading" ? "" : " ") ??
    ""
  );
}
