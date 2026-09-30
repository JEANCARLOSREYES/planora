import { Flag } from "lucide-react";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`priority-badge priority-${priority.toLowerCase()}`}>
      <Flag size={12} />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      <span />
      {STATUS_LABELS[status]}
    </span>
  );
}
