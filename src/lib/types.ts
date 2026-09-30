export const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskStatus = (typeof STATUSES)[number];
export type TaskPriority = (typeof PRIORITIES)[number];
export const STATUS_LABELS: Record<TaskStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};
export type PageSummary = {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  favorite: boolean;
  position: number;
  cover: string | null;
  createdAt: string;
  updatedAt: string;
};
export type TaskRecord = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  databaseId: string | null;
  completedAt: string | null;
  tags: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};
export type DatabaseSummary = {
  id: string;
  name: string;
  description: string;
  icon: string;
};
export type ActionResult<T> =
  { ok: true; data: T } | { ok: false; error: string };
export type EditorNode = {
  type: string;
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: EditorNode[];
};
