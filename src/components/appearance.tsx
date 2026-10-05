"use client";

import { useEffect, useSyncExternalStore } from "react";

const key = "planora:appearance";
const event = "planora:appearance-change";
export const defaultAppearance = {
  palette: "lavender",
  font: "sans",
  size: "standard",
  motion: "system",
} as const;
export type Appearance = {
  palette: "lavender" | "ocean" | "forest" | "rose";
  font: "sans" | "serif" | "mono";
  size: "standard" | "large";
  motion: "system" | "reduced";
};
export function parseAppearance(raw: string | null): Appearance {
  try {
    const value = JSON.parse(raw ?? "{}");
    return {
      palette: ["lavender", "ocean", "forest", "rose"].includes(value?.palette)
        ? value.palette
        : "lavender",
      font: ["sans", "serif", "mono"].includes(value?.font)
        ? value.font
        : "sans",
      size: value?.size === "large" ? "large" : "standard",
      motion: value?.motion === "reduced" ? "reduced" : "system",
    };
  } catch {
    return { ...defaultAppearance };
  }
}
function snapshot() {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(event, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(event, notify);
  };
}
export function useAppearance() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  return parseAppearance(raw);
}
export function saveAppearance(value: Appearance) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(event));
    return true;
  } catch {
    return false;
  }
}
export function AppearanceEffects() {
  const { palette, font, size, motion } = useAppearance();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.palette = palette;
    root.dataset.readingFont = font;
    root.dataset.readingSize = size;
    root.dataset.motion = motion;
  }, [palette, font, size, motion]);
  return null;
}
