"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  Home,
  Menu,
  PanelLeftOpen,
  Plus,
  Search,
  Check,
  Sun,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { Sidebar } from "./sidebar";
import {
  WorkspaceContext,
  type WorkspaceContextValue,
} from "./workspace-context";
import { Button } from "@/components/ui/button";
import { PageActions } from "@/components/pages/page-actions";
import type { DatabaseSummary, PageSummary, TaskRecord } from "@/lib/types";

const CreatePageDialog = dynamic(() =>
  import("@/components/pages/create-page-dialog").then(
    (module) => module.CreatePageDialog,
  ),
);
const TaskDialog = dynamic(() =>
  import("@/components/tasks/task-dialog").then((module) => module.TaskDialog),
);
const DatabaseDialog = dynamic(() =>
  import("@/components/database/database-dialog").then(
    (module) => module.DatabaseDialog,
  ),
);
const CommandPalette = dynamic(() =>
  import("@/components/search/command-palette").then(
    (module) => module.CommandPalette,
  ),
);

export function WorkspaceShell({
  children,
  workspaceName,
  pages,
  databases,
  openTasks,
}: {
  children: ReactNode;
  workspaceName: string;
  pages: PageSummary[];
  databases: DatabaseSummary[];
  openTasks: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageDialog, setPageDialog] = useState<{
    parentId?: string | null;
    template?: string;
  } | null>(null);
  const [taskDialog, setTaskDialog] = useState<{
    task?: TaskRecord;
    defaults?: {
      dueDate?: string;
      databaseId?: string;
      status?: TaskRecord["status"];
    };
  } | null>(null);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved");
  const pathname = usePathname();
  const router = useRouter();
  const openPage = useCallback<WorkspaceContextValue["openPage"]>(
    (parentId, template) => {
      setMobileOpen(false);
      setPageDialog({ parentId, template });
    },
    [],
  );
  const openTask = useCallback<WorkspaceContextValue["openTask"]>(
    (task, defaults) => {
      setMobileOpen(false);
      setTaskDialog({ task, defaults });
    },
    [],
  );
  const openSearch = useCallback(() => {
    setMobileOpen(false);
    setSearchOpen(true);
  }, []);
  const openDatabase = useCallback(() => {
    setMobileOpen(false);
    setDatabaseOpen(true);
  }, []);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  const value = useMemo(
    () => ({
      pages,
      databases,
      openPage,
      openTask,
      openDatabase,
      openSearch,
      saveStatus,
      setSaveStatus,
    }),
    [
      pages,
      databases,
      openPage,
      openTask,
      openDatabase,
      openSearch,
      saveStatus,
    ],
  );
  const currentPage = pages.find(
    (page) => pathname === `/workspace/page/${page.id}`,
  );
  const currentDatabase = databases.find(
    (database) => pathname === `/workspace/database/${database.id}`,
  );
  const routeTitle =
    pathname === "/workspace"
      ? "Home"
      : pathname === "/workspace/tasks"
        ? "Tasks"
        : pathname === "/workspace/calendar"
          ? "Calendar"
          : pathname === "/workspace/templates"
            ? "Templates"
            : pathname === "/workspace/settings"
              ? "Settings"
              : (currentDatabase?.name ?? "Page");
  const ancestors: PageSummary[] = [];
  let parentId = currentPage?.parentId;
  const seen = new Set<string>();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const page = pages.find((item) => item.id === parentId);
    if (!page) break;
    ancestors.unshift(page);
    parentId = page.parentId;
  }
  return (
    <WorkspaceContext.Provider value={value}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className={`workspace-shell ${collapsed ? "is-collapsed" : ""}`}>
        <aside className="sidebar desktop-sidebar">
          <Sidebar
            workspaceName={workspaceName}
            openTasks={openTasks}
            collapse={() => setCollapsed(true)}
            closeMobile={() => setMobileOpen(false)}
          />
        </aside>
        <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="dialog-overlay mobile-overlay" />
            <DialogPrimitive.Content className="sidebar mobile-sidebar">
              <DialogPrimitive.Title className="sr-only">
                Workspace navigation
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                Pages, tasks, databases, and settings.
              </DialogPrimitive.Description>
              <Sidebar
                workspaceName={workspaceName}
                openTasks={openTasks}
                collapse={() => setMobileOpen(false)}
                closeMobile={() => setMobileOpen(false)}
              />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        <div className="workspace-main">
          <header className="topbar">
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>
            {collapsed && (
              <Button
                className="desktop-expand"
                variant="ghost"
                size="icon"
                aria-label="Expand sidebar"
                onClick={() => setCollapsed(false)}
              >
                <PanelLeftOpen size={19} />
              </Button>
            )}
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/workspace" aria-label="Workspace home">
                <Home size={16} />
              </Link>
              <ChevronRight size={13} />
              <span className="workspace-crumb">{workspaceName}</span>
              {ancestors.slice(-2).map((page) => (
                <span className="ancestor-crumb" key={page.id}>
                  <ChevronRight size={13} />
                  <Link href={`/workspace/page/${page.id}`}>{page.title}</Link>
                </span>
              ))}
              <ChevronRight size={13} />
              <span className="current-crumb">
                {currentPage?.title ?? routeTitle}
              </span>
            </nav>
            <div className="topbar-actions">
              {currentPage ? (
                <>
                  <span
                    className={`save-indicator ${saveStatus.includes("Unable") || saveStatus.includes("conflict") ? "danger-text" : ""}`}
                    role="status"
                  >
                    {saveStatus === "Saved" && <Check size={14} />}
                    {saveStatus}
                  </span>
                  <PageActions page={currentPage} />
                </>
              ) : (
                <>
                  <span className="topbar-note">
                    <Sun size={15} /> A little clarity goes a long way
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Open search"
                    onClick={openSearch}
                  >
                    <Search size={18} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Quick create page"
                    onClick={() => openPage()}
                  >
                    <Plus size={19} />
                  </Button>
                </>
              )}
            </div>
          </header>
          <main id="main-content">{children}</main>
        </div>
      </div>
      {pageDialog && (
        <CreatePageDialog
          {...pageDialog}
          pages={pages}
          onClose={() => setPageDialog(null)}
        />
      )}
      {taskDialog && (
        <TaskDialog
          {...taskDialog}
          databases={databases}
          onClose={() => {
            setTaskDialog(null);
            const url = new URL(window.location.href);
            if (url.searchParams.has("task")) {
              url.searchParams.delete("task");
              router.replace(`${url.pathname}${url.search}`, { scroll: false });
            }
          }}
        />
      )}
      {databaseOpen && (
        <DatabaseDialog onClose={() => setDatabaseOpen(false)} />
      )}
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </WorkspaceContext.Provider>
  );
}
