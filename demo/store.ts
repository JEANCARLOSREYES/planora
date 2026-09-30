import { z } from "zod";
import { addDays, format } from "date-fns";
import {
  templateContent,
  welcomeContent,
  templates,
} from "../src/lib/templates";
import { contentSchema } from "../src/lib/validation";
import type {
  PageSummary,
  TaskRecord,
  DatabaseSummary,
  EditorNode,
} from "../src/lib/types";
import { notify } from "./navigation";

export type DemoPage = PageSummary & { content: EditorNode; revision: number };
export type DemoStore = {
  name: string;
  pages: DemoPage[];
  tasks: TaskRecord[];
  databases: DatabaseSummary[];
};
export const STORAGE_KEY = "planora:public-demo:v1";
const schema = z.object({
  name: z.string().max(80),
  pages: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      icon: z.string(),
      cover: z.string().nullable(),
      parentId: z.string().nullable(),
      favorite: z.boolean(),
      position: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
      revision: z.number().int().nonnegative(),
      content: contentSchema,
    }),
  ),
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
      priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
      dueDate: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      completedAt: z.string().nullable(),
      databaseId: z.string().nullable(),
      tags: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  ),
  databases: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      icon: z.string(),
    }),
  ),
});
export function seed(): DemoStore {
  const now = new Date().toISOString();
  const names = [
    "Welcome to Planora",
    "Semester Planner",
    "Career Goals",
    "Project Ideas",
    "Meeting Notes",
  ];
  const kinds = ["blank", "study", "project", "project", "meeting"];
  const icons = ["👋", "🎓", "🌱", "💡", "💬"];
  const pages: DemoPage[] = names.map((title, i) => ({
    id: `demo-page-${i}`,
    title,
    icon: icons[i],
    cover: ["indigo", "ocean", "forest", "sunrise", "rose"][i],
    parentId: null,
    favorite: [0, 1, 3].includes(i),
    position: i,
    content: i === 0 ? welcomeContent : templateContent(kinds[i]),
    revision: 0,
    createdAt: now,
    updatedAt: now,
  }));
  pages.push({
    ...pages[1],
    id: "demo-weekly",
    title: "Weekly study plan",
    icon: "📚",
    parentId: pages[1].id,
    favorite: false,
    content: templateContent("weekly"),
  });
  const taskNames = [
    "Finish analytics assignment",
    "Update GitHub portfolio",
    "Review finance notes",
    "Work on coding project",
    "Prepare weekly schedule",
  ];
  const tasks: TaskRecord[] = taskNames.map((title, i) => ({
    id: `demo-task-${i}`,
    title,
    description: "",
    status:
      i === 4
        ? "COMPLETED"
        : i === 0 || i === 3
          ? "IN_PROGRESS"
          : "NOT_STARTED",
    priority: i < 2 ? "HIGH" : i === 4 ? "LOW" : "MEDIUM",
    dueDate: format(addDays(new Date(), [0, 1, -1, 2, 0][i]), "yyyy-MM-dd"),
    completedAt: i === 4 ? now : null,
    databaseId: i === 1 || i === 3 ? "demo-database" : null,
    tags: [
      {
        id: `demo-tag-${i}`,
        name: ["university", "career", "university", "personal", "personal"][i],
      },
    ],
    createdAt: now,
    updatedAt: now,
  }));
  return {
    name: "My Workspace",
    pages,
    tasks,
    databases: [
      {
        id: "demo-database",
        name: "Personal projects",
        description:
          "Ideas in motion. Keep your projects moving, one task at a time.",
        icon: "📋",
      },
    ],
  };
}
let cache: DemoStore | undefined;
let raw: string | null | undefined;
export function readStore(): DemoStore {
  const current = localStorage.getItem(STORAGE_KEY);
  if (cache && current === raw) return cache;
  if (current) {
    const result = schema.safeParse(JSON.parse(current));
    if (!result.success)
      throw new Error(
        "This browser’s demo data could not be read. Clear this site’s browser data to start a fresh demo.",
      );
    cache = result.data;
  } else {
    cache = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  }
  raw = localStorage.getItem(STORAGE_KEY);
  return cache;
}
export function mutate<T>(work: (store: DemoStore) => T): T {
  const next = structuredClone(readStore());
  const result = work(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cache = next;
  raw = localStorage.getItem(STORAGE_KEY);
  notify();
  return result;
}
export function createDemoPage(
  store: DemoStore,
  title: string,
  parentId: string | null,
  template = "blank",
) {
  const now = new Date().toISOString();
  const definition = templates.find((t) => t.id === template) ?? templates[0];
  const page: DemoPage = {
    id: crypto.randomUUID(),
    title,
    parentId,
    icon: definition.icon,
    cover: template === "blank" ? null : definition.color,
    favorite: false,
    position: store.pages.length,
    revision: 0,
    content: templateContent(template),
    createdAt: now,
    updatedAt: now,
  };
  store.pages.push(page);
  return page;
}
