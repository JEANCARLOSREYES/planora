import { Component, useSyncExternalStore, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "../src/app/globals.css";
import "./style.css";
import { Providers } from "../src/components/providers";
import { WorkspaceShell } from "../src/components/layout/workspace-shell";
import { Dashboard } from "../src/components/home/dashboard";
import { TaskWorkspace } from "../src/components/tasks/task-workspace";
import { PageDocument } from "../src/components/pages/page-document";
import { SettingsPanel } from "../src/components/settings/settings-panel";
import { TemplateGallery } from "../src/components/pages/template-gallery";
import { todayKey } from "../src/lib/utils";
import { readStore } from "./store";
import { subscribe, useLocation } from "./navigation";
import Link from "./link";
import { installDemoTransport } from "./transport";

function App() {
  const location = useLocation();
  const path = location.split("?")[0];
  const store = useSyncExternalStore(subscribe, readStore);
  const pages = [...store.pages].sort((a, b) => a.position - b.position);
  const open = store.tasks.filter((t) => t.status !== "COMPLETED");
  const today = todayKey();
  let content: ReactNode;
  if (path === "/" || path === "/workspace")
    content = (
      <Dashboard
        data={{
          recent: [...pages]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .slice(0, 3),
          created: [...pages]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 3),
          tasks: open
            .filter((t) => t.dueDate)
            .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
            .slice(0, 5),
          totalTasks: store.tasks.length,
          completedTasks: store.tasks.length - open.length,
          dueToday: open.filter((t) => t.dueDate === today).length,
          overdue: open.filter((t) => t.dueDate && t.dueDate < today).length,
          pageCount: pages.length,
          today,
        }}
      />
    );
  else if (path === "/workspace/tasks" || path === "/workspace/calendar")
    content = (
      <TaskWorkspace
        key={
          path +
          ":" +
          new URLSearchParams(location.split("?")[1]).get("tag") +
          ":" +
          new URLSearchParams(location.split("?")[1]).get("due")
        }
        tasks={store.tasks}
        initialView={path.endsWith("calendar") ? "calendar" : "table"}
      />
    );
  else if (path === "/workspace/templates") content = <TemplateGallery />;
  else if (path === "/workspace/settings")
    content = <SettingsPanel key={store.name} workspaceName={store.name} />;
  else if (path.startsWith("/workspace/page/")) {
    const page = pages.find((p) => p.id === path.split("/").pop());
    content = page ? (
      <PageDocument
        key={page.id}
        page={page}
        content={page.content}
        revision={page.revision}
      />
    ) : (
      <Missing />
    );
  } else if (path.startsWith("/workspace/database/")) {
    const database = store.databases.find(
      (d) => d.id === path.split("/").pop(),
    );
    content = database ? (
      <TaskWorkspace
        key={database.id}
        database={database}
        tasks={store.tasks.filter((t) => t.databaseId === database.id)}
      />
    ) : (
      <Missing />
    );
  } else content = <Missing />;
  return (
    <Providers>
      <WorkspaceShell
        workspaceName={store.name}
        pages={pages}
        databases={store.databases}
        openTasks={open.length}
      >
        <div className="demo-banner" role="note">
          Public demo · Your changes stay in this browser. Reset your demo in
          Settings.
        </div>
        {content}
      </WorkspaceShell>
    </Providers>
  );
}
function Missing() {
  return (
    <div className="content-wrap">
      <h1>This item is no longer here.</h1>
      <Link href="/workspace">Back to your workspace</Link>
    </div>
  );
}
class DemoBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <main className="content-wrap">
        <h1>The demo could not open.</h1>
        <p>{this.state.error}</p>
        <p>
          Enable browser storage for this site, then reload. Your local Planora
          application is unaffected.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
installDemoTransport();
createRoot(document.getElementById("root")!).render(
  <DemoBoundary>
    <App />
  </DemoBoundary>,
);
