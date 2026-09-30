"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Command } from "cmdk";
import {
  CalendarDays,
  CircleCheck,
  FilePlus2,
  Home,
  LoaderCircle,
  Moon,
  Search,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { useWorkspace } from "@/components/layout/workspace-context";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SearchResults = {
  pages: { id: string; title: string; icon: string; excerpt: string }[];
  tasks: { id: string; title: string }[];
  tags: { id: string; name: string }[];
};
const empty: SearchResults = { pages: [], tasks: [], tags: [] };
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { openPage, openTask } = useWorkspace();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults(empty);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error("Search is unavailable. Please try again.");
        setResults(await response.json());
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "Search failed.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  function run(callback: () => void) {
    onClose();
    callback();
  }
  function go(path: string) {
    run(() => router.push(path));
  }
  const commands = [
    { label: "Create new page", icon: FilePlus2, action: () => openPage() },
    { label: "Create task", icon: CircleCheck, action: () => openTask() },
    {
      label: "Go to Home",
      icon: Home,
      action: () => router.push("/workspace"),
    },
    {
      label: "Go to Tasks",
      icon: CircleCheck,
      action: () => router.push("/workspace/tasks"),
    },
    {
      label: "Go to Calendar",
      icon: CalendarDays,
      action: () => router.push("/workspace/calendar"),
    },
    {
      label: "Toggle theme",
      icon: Moon,
      action: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
    },
    {
      label: "Open Settings",
      icon: Settings,
      action: () => router.push("/workspace/settings"),
    },
  ].filter(
    (command) =>
      !query || command.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Find your way"
      description="Search your workspace or jump to an action."
      wide
    >
      <Command shouldFilter={false} className="command-root">
        <div className="command-search">
          <Search size={20} />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={(value) => {
              setQuery(value);
              setResults(empty);
              setLoading(Boolean(value.trim()));
            }}
            placeholder="Search pages, tasks, tags, or commands…"
            aria-label="Search workspace"
          />
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            query && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </Button>
            )
          )}
        </div>
        <Command.List>
          {!loading && !error && (
            <Command.Empty>No results found.</Command.Empty>
          )}
          {error && (
            <p className="form-error p-4" role="alert">
              {error}
            </p>
          )}
          {results.pages.length > 0 && (
            <Command.Group heading="Pages">
              {results.pages.map((page) => (
                <Command.Item
                  key={page.id}
                  value={`page-${page.id}`}
                  onSelect={() => go(`/workspace/page/${page.id}`)}
                >
                  <span className="command-result-icon">{page.icon}</span>
                  <span>
                    <strong>{page.title}</strong>
                    <small>{page.excerpt}</small>
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {results.tasks.length > 0 && (
            <Command.Group heading="Tasks">
              {results.tasks.map((task) => (
                <Command.Item
                  key={task.id}
                  value={`task-${task.id}`}
                  onSelect={() => go(`/workspace/tasks?task=${task.id}`)}
                >
                  <CircleCheck size={18} />
                  {task.title}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {results.tags.length > 0 && (
            <Command.Group heading="Tags">
              {results.tags.map((tag) => (
                <Command.Item
                  key={tag.id}
                  value={`tag-${tag.id}`}
                  onSelect={() =>
                    go(`/workspace/tasks?tag=${encodeURIComponent(tag.name)}`)
                  }
                >
                  <Tag size={17} />
                  {tag.name}
                </Command.Item>
              ))}
            </Command.Group>
          )}
          {commands.length > 0 && (
            <Command.Group heading="Quick actions">
              {commands.map((command) => (
                <Command.Item
                  key={command.label}
                  value={command.label}
                  onSelect={() => run(command.action)}
                >
                  <command.icon size={18} />
                  {command.label}
                  <span className="ml-auto muted">↵</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
        <div className="command-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to navigate
          </span>
          <span>
            <kbd>↵</kbd> to select
          </span>
          <span>
            <kbd>esc</kbd> to close
          </span>
        </div>
      </Command>
    </Dialog>
  );
}
