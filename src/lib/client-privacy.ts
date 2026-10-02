"use client";
export function clearPlanoraDrafts() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith("planora:draft:")) localStorage.removeItem(key);
  }
}
