import { editorSaveSchema, extractText } from "../src/lib/validation";
import { mutate, readStore } from "./store";
import { z } from "zod";

// Only the static demo installs this transport. The Next.js app keeps its real API.
export function installDemoTransport() {
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
      window.location.origin,
    );
    if (url.origin !== window.location.origin) return original(input, init);
    if (url.pathname === "/api/search") {
      const query = (url.searchParams.get("q") ?? "")
        .trim()
        .toLowerCase()
        .slice(0, 200);
      const store = readStore();
      const pages = store.pages
        .filter((p) =>
          `${p.title} ${extractText(p.content)}`.toLowerCase().includes(query),
        )
        .slice(0, 8)
        .map((p) => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
          excerpt: extractText(p.content).slice(0, 100),
        }));
      const tasks = store.tasks
        .filter((t) =>
          `${t.title} ${t.description} ${t.tags.map((t) => t.name).join(" ")}`
            .toLowerCase()
            .includes(query),
        )
        .slice(0, 8);
      const tags = [
        ...new Set(store.tasks.flatMap((t) => t.tags.map((t) => t.name))),
      ]
        .filter((name) => name.includes(query))
        .slice(0, 5)
        .map((name) => ({ id: name, name }));
      return Response.json(
        query ? { pages, tasks, tags } : { pages: [], tasks: [], tags: [] },
      );
    }
    const match = url.pathname.match(/^\/api\/pages\/([^/]+)\/content$/);
    if (match && init?.method === "PUT") {
      try {
        const data = editorSaveSchema.parse(JSON.parse(String(init.body)));
        const page = readStore().pages.find((p) => p.id === match[1]);
        if (!page || page.revision !== data.revision)
          return Response.json(
            {
              error:
                "This page changed in another tab or was deleted. Your draft is kept on this device. Reload to compare versions.",
            },
            { status: 409 },
          );
        mutate((store) => {
          const p = store.pages.find((p) => p.id === match[1])!;
          p.content = data.content;
          p.revision++;
          p.updatedAt = new Date().toISOString();
        });
        return Response.json({ revision: data.revision + 1 });
      } catch (error) {
        return Response.json(
          {
            error:
              error instanceof z.ZodError
                ? error.issues[0].message
                : error instanceof Error
                  ? error.message
                  : "Could not save this demo.",
          },
          { status: error instanceof z.ZodError ? 400 : 500 },
        );
      }
    }
    return original(input, init);
  };
}
