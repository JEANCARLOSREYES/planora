"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  Database,
  GripVertical,
  Home,
  LayoutTemplate,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./workspace-context";
import { cn } from "@/lib/utils";
import { reorderPagesAction } from "@/app/actions";
import type { PageSummary } from "@/lib/types";

export function Sidebar({
  workspaceName,
  openTasks,
  collapse,
  closeMobile,
}: {
  workspaceName: string;
  openTasks: number;
  collapse: () => void;
  closeMobile: () => void;
}) {
  const { pages, databases, openPage, openTask, openSearch, openDatabase } =
    useWorkspace();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function reorder(event: DragEndEvent) {
    if (!event.over || event.active.id === event.over.id) return;
    const source = pages.find((page) => page.id === event.active.id);
    const target = pages.find((page) => page.id === event.over?.id);
    if (!source || !target || source.parentId !== target.parentId) {
      toast.info(
        "Reorder sibling pages here. Use Page properties to change a page’s parent.",
      );
      return;
    }
    const siblings = pages.filter((page) => page.parentId === source.parentId);
    const ids = arrayMove(
      siblings.map((page) => page.id),
      siblings.findIndex((page) => page.id === source.id),
      siblings.findIndex((page) => page.id === target.id),
    );
    startTransition(async () => {
      const result = await reorderPagesAction({
        parentId: source.parentId,
        ids,
      });
      if (!result.ok) toast.error(result.error);
    });
  }
  const nav = [
    { title: "Home", path: "/workspace", icon: Home },
    { title: "Tasks", path: "/workspace/tasks", icon: CircleCheck },
    { title: "Calendar", path: "/workspace/calendar", icon: CalendarDays },
  ];
  return (
    <>
      <div className="sidebar-brand">
        <Link href="/workspace" aria-label="Planora home" onClick={closeMobile}>
          <Logo />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={collapse}
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={17} />
        </Button>
      </div>
      <Link
        href="/workspace/settings"
        className="workspace-picker"
        onClick={closeMobile}
      >
        <span className="workspace-avatar">
          {workspaceName.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <strong>{workspaceName}</strong>
          <span>Personal workspace</span>
        </span>
        <ChevronsUpDown size={15} />
      </Link>
      <div className="sidebar-primary">
        <Button variant="primary" className="w-full" onClick={() => openPage()}>
          <Plus size={17} /> New page
        </Button>
        <button className="sidebar-search" onClick={openSearch}>
          <Search size={16} />
          <span>Search anything</span>
          <kbd>⌘ K</kbd>
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        {nav.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={closeMobile}
            className={cn("nav-link", pathname === item.path && "active")}
            aria-current={pathname === item.path ? "page" : undefined}
          >
            <item.icon size={18} />
            <span>{item.title}</span>
            {item.title === "Tasks" && openTasks > 0 && (
              <span className="nav-count">{openTasks}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="sidebar-scroll">
        <section className="sidebar-section">
          <div className="section-label">
            Favorites<span>✦</span>
          </div>
          {pages
            .filter((page) => page.favorite)
            .map((page) => (
              <Link
                className="nav-link page-link"
                href={`/workspace/page/${page.id}`}
                key={page.id}
                onClick={closeMobile}
              >
                <span>{page.icon}</span>
                <span className="truncate">{page.title}</span>
              </Link>
            ))}
          {!pages.some((page) => page.favorite) && (
            <p className="sidebar-hint">Star a page to keep it close.</p>
          )}
        </section>
        <section className="sidebar-section">
          <div className="section-label">
            Your pages
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openPage()}
              aria-label="Add page"
            >
              <Plus size={15} />
            </Button>
          </div>
          <DndContext
            id="sidebar-pages"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={reorder}
          >
            <SortableContext
              items={pages.map((page) => page.id)}
              strategy={verticalListSortingStrategy}
            >
              {pages
                .filter((page) => !page.parentId)
                .map((page) => (
                  <PageTree
                    key={page.id}
                    page={page}
                    depth={0}
                    disabled={pending}
                    onNavigate={closeMobile}
                  />
                ))}
            </SortableContext>
          </DndContext>
          {pages.length === 0 && (
            <button className="nav-link muted" onClick={() => openPage()}>
              <Plus size={16} />
              Create your first page
            </button>
          )}
          <button className="nav-link muted mt-1" onClick={() => openPage()}>
            <Plus size={16} /> Add a page
          </button>
        </section>
        <section className="sidebar-section">
          <div className="section-label">
            Databases
            <Button
              variant="ghost"
              size="icon"
              onClick={openDatabase}
              aria-label="Create database"
            >
              <Plus size={15} />
            </Button>
          </div>
          {databases.map((database) => (
            <Link
              className={cn(
                "nav-link page-link",
                pathname === `/workspace/database/${database.id}` && "active",
              )}
              key={database.id}
              href={`/workspace/database/${database.id}`}
              onClick={closeMobile}
            >
              <Database size={16} />
              <span className="truncate">{database.name}</span>
            </Link>
          ))}
        </section>
      </div>
      <div className="sidebar-bottom">
        <Link
          href="/workspace/templates"
          className={cn(
            "nav-link",
            pathname === "/workspace/templates" && "active",
          )}
          onClick={closeMobile}
        >
          <LayoutTemplate size={18} />
          Templates<span className="tiny-label">5</span>
        </Link>
        <Link
          href="/workspace/settings"
          className={cn(
            "nav-link",
            pathname === "/workspace/settings" && "active",
          )}
          onClick={closeMobile}
        >
          <Settings size={18} />
          Settings
        </Link>
        <button className="sidebar-note" onClick={() => openTask()}>
          <Sparkles size={18} />
          <span>
            A little clarity, every day.
            <small>Make space for your next step.</small>
          </span>
          <Plus size={16} />
        </button>
        <div className="sidebar-footer">
          <span className="local-dot" />
          Private to your account.
        </div>
      </div>
    </>
  );
}
function PageTree({
  page,
  depth,
  disabled,
  onNavigate,
}: {
  page: PageSummary;
  depth: number;
  disabled: boolean;
  onNavigate: () => void;
}) {
  const { pages, openPage } = useWorkspace();
  const children = pages.filter((item) => item.parentId === page.id);
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div
        className={cn(
          "page-tree-row",
          pathname === `/workspace/page/${page.id}` && "active",
        )}
        style={{ paddingLeft: `${Math.min(depth, 5) * 12 + 2}px` }}
      >
        <button
          className="tree-toggle"
          onClick={() => setExpanded(!expanded)}
          disabled={!children.length}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${page.title}`}
          aria-expanded={children.length ? expanded : undefined}
        >
          {children.length > 0 &&
            (expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
        </button>
        <Link
          href={`/workspace/page/${page.id}`}
          onClick={onNavigate}
          aria-current={
            pathname === `/workspace/page/${page.id}` ? "page" : undefined
          }
        >
          <span>{page.icon}</span>
          <span className="truncate">{page.title}</span>
        </Link>
        <button
          className="tree-add"
          aria-label={`Add page inside ${page.title}`}
          onClick={() => {
            setExpanded(true);
            openPage(page.id);
          }}
        >
          <Plus size={13} />
        </button>
        <button
          className="tree-grip"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${page.title}`}
        >
          <GripVertical size={12} />
        </button>
      </div>
      {expanded &&
        children.map((child) => (
          <PageTree
            key={child.id}
            page={child}
            depth={depth + 1}
            disabled={disabled}
            onNavigate={onNavigate}
          />
        ))}
    </div>
  );
}
