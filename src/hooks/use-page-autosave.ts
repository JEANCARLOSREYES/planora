"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { contentSchema } from "@/lib/validation";
import type { EditorNode } from "@/lib/types";

type Draft = { content: EditorNode; revision: number };
export function usePageAutosave(
  id: string,
  initialRevision: number,
  initialContent: EditorNode,
) {
  const [status, setStatus] = useState("Saved");
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState<Draft | null>(null);
  const originalContent = useRef(initialContent);
  const state = useRef({
    revision: initialRevision,
    dirty: false,
    saving: false,
    blocked: false,
    content: initialContent,
    timer: null as ReturnType<typeof setTimeout> | null,
  });
  const storageKey = `planora:draft:${id}`;
  const persistDraft = useCallback(
    (draft: Draft) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        setError(
          "Device draft storage is full or unavailable. Keep this page open until it says Saved.",
        );
      }
    },
    [storageKey],
  );
  const flush = useCallback(async () => {
    const current = state.current;
    if (current.saving || !current.dirty || current.blocked) return;
    current.saving = true;
    setStatus("Saving…");
    try {
      while (current.dirty && !current.blocked) {
        const content = current.content;
        const body = JSON.stringify({ content, revision: current.revision });
        const response = await fetch(`/api/pages/${id}/content`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: body.length < 60_000,
        });
        const result = await response.json();
        if (!response.ok) {
          current.blocked = response.status === 409;
          throw new Error(result.error ?? "Unable to save. Please try again.");
        }
        current.revision = result.revision;
        if (current.content === content) {
          current.dirty = false;
          try {
            const draft = localStorage.getItem(storageKey);
            if (
              draft &&
              JSON.stringify(JSON.parse(draft).content) ===
                JSON.stringify(content)
            ) {
              localStorage.removeItem(storageKey);
            }
          } catch {
            /* The database save succeeded even if local storage is unavailable. */
          }
        } else
          persistDraft({
            content: current.content,
            revision: current.revision,
          });
      }
      setError("");
      setStatus("Saved");
    } catch (failure) {
      persistDraft({ content: current.content, revision: current.revision });
      setStatus(current.blocked ? "Save conflict" : "Unable to save");
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to save. Your draft is kept on this device.",
      );
    } finally {
      current.saving = false;
    }
  }, [id, storageKey, persistDraft]);
  const change = useCallback(
    (content: EditorNode) => {
      const current = state.current;
      current.content = content;
      current.dirty = true;
      persistDraft({ content, revision: current.revision });
      setStatus(current.blocked ? "Save conflict" : "Unsaved changes");
      if (current.timer) clearTimeout(current.timer);
      current.timer = setTimeout(() => {
        void flush();
      }, 800);
    },
    [flush, persistDraft],
  );
  useEffect(() => {
    const current = state.current;
    const timer = setTimeout(() => {
      try {
        const value = localStorage.getItem(storageKey);
        if (value) {
          const draft = JSON.parse(value);
          if (
            contentSchema.safeParse(draft.content).success &&
            JSON.stringify(draft.content) !==
              JSON.stringify(originalContent.current)
          )
            setRecovery(draft);
        }
      } catch {
        setError(
          "A previous device draft could not be read. Your saved page is still available.",
        );
      }
    }, 0);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (current.dirty) {
        void flush();
        event.preventDefault();
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const online = () => {
      void flush();
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", online);
    return () => {
      clearTimeout(timer);
      if (current.timer) clearTimeout(current.timer);
      void flush();
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", online);
    };
  }, [storageKey, flush]);
  function discardRecovery() {
    setRecovery(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      setError("Could not remove the local draft.");
    }
  }
  return {
    status,
    error,
    recovery,
    change,
    flush,
    discardRecovery,
    acceptRecovery: () => setRecovery(null),
  };
}
