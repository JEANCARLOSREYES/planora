import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function dateLabel(date: string | null) {
  return date ? format(parseISO(date), "MMM d") : "No date";
}
export function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}
