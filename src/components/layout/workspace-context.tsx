"use client";
import { createContext, useContext } from "react";
import type { DatabaseSummary, PageSummary, TaskRecord } from "@/lib/types";

export type WorkspaceContextValue = {
  pages: PageSummary[];
  databases: DatabaseSummary[];
  openPage: (parentId?: string | null, template?: string) => void;
  openTask: (
    task?: TaskRecord,
    options?: {
      dueDate?: string;
      databaseId?: string;
      status?: TaskRecord["status"];
    },
  ) => void;
  openDatabase: () => void;
  openSearch: () => void;
  saveStatus: string;
  setSaveStatus: (value: string) => void;
};
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value)
    throw new Error("Workspace controls require the workspace layout.");
  return value;
}
