"use client";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  CircleCheck,
  Clock3,
  FilePlus2,
  FileText,
  LayoutTemplate,
  Plus,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { useWorkspace } from "@/components/layout/workspace-context";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskCheck } from "@/components/tasks/task-check";
import { PriorityBadge } from "@/components/tasks/task-badges";
import { dateLabel } from "@/lib/utils";
import type { PageSummary, TaskRecord } from "@/lib/types";

export type DashboardData = {
  recent: PageSummary[];
  created: PageSummary[];
  tasks: TaskRecord[];
  totalTasks: number;
  completedTasks: number;
  dueToday: number;
  overdue: number;
  pageCount: number;
  today: string;
};
export function Dashboard({ data }: { data: DashboardData }) {
  const { openPage, openTask, pages } = useWorkspace();
  const percentage = data.totalTasks
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;
  const favorites = pages.filter((page) => page.favorite);
  return (
    <div className="content-wrap dashboard">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="accent-dot" />
            YOUR SPACE TO MAKE THINGS HAPPEN
          </div>
          <h1>
            A fresh perspective<span className="accent-text">.</span>
          </h1>
          <p>Welcome back. Let’s make room for what matters.</p>
        </div>
        <span className="today-pill">
          <CalendarDays size={16} />
          {format(new Date(`${data.today}T12:00:00`), "EEEE, MMMM d")}
        </span>
      </div>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <div className="small-caps">
            A LITTLE FOCUS. A LOT OF POSSIBILITY.
          </div>
          <h2>
            Big ideas start
            <br />
            with a little space.
          </h2>
          <p>
            Capture a thought, map out your week,
            <br className="desktop-break" /> or take the next step. This space
            is yours.
          </p>
          <Button variant="primary" onClick={() => openPage()}>
            <Plus size={17} />
            Create a page
            <ArrowRight size={16} />
          </Button>
        </div>
        <div className="welcome-composition" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="floating-label label-ideas">
            <span>✦</span> A place for your ideas
          </div>
          <div className="composition-card">
            <div className="composition-top">
              <span className="composition-icon">
                <Target size={24} />
              </span>
              <span>
                Make it happen<small>One step at a time</small>
              </span>
              <span className="composition-spark">✦</span>
            </div>
            <div className="composition-line">
              <span className="demo-check">
                <Check size={12} />
              </span>
              A little intention
            </div>
            <div className="composition-line">
              <span className="demo-check">
                <Check size={12} />
              </span>
              A clear next step
            </div>
            <div className="composition-line">
              <span className="demo-circle" />
              Something to look forward to
            </div>
            <div className="composition-progress">
              <span />
            </div>
          </div>
          <div className="floating-label label-progress">
            <span className="green-check">
              <Check size={13} />
            </span>
            Progress, at your pace
          </div>
          <span className="decorative-cross">✧</span>
        </div>
      </section>
      <section className="overview-grid" aria-label="Workspace overview">
        <div className="overview-card">
          <span className="stat-icon purple">
            <CircleCheck size={20} />
          </span>
          <div>
            <span>Tasks completed</span>
            <strong>
              {data.completedTasks}
              <small> / {data.totalTasks}</small>
            </strong>
          </div>
          <span className="stat-caption">Little wins add up</span>
        </div>
        <div className="overview-card">
          <span className="stat-icon orange">
            <Target size={20} />
          </span>
          <div>
            <span>Due today</span>
            <strong>{data.dueToday}</strong>
          </div>
          <Link
            className="stat-link"
            href="/workspace/tasks?due=today"
            aria-label="View tasks due today"
          >
            <ArrowDownRight size={19} />
          </Link>
        </div>
        <div className="overview-card">
          <span className="stat-icon blue">
            <FileText size={20} />
          </span>
          <div>
            <span>Pages in your space</span>
            <strong>{data.pageCount}</strong>
          </div>
          <span className="stat-caption">Ideas, all together</span>
        </div>
      </section>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>
                <Clock3 size={18} />
                Pick up where you left off
              </h2>
              <Button variant="ghost" size="sm" onClick={() => openPage()}>
                <Plus size={15} />
                New page
              </Button>
            </div>
            <div className="recent-grid">
              {data.recent.slice(0, 3).map((page) => (
                <Link
                  className="recent-card"
                  href={`/workspace/page/${page.id}`}
                  key={page.id}
                >
                  <div
                    className={`page-card-cover cover-${page.cover ?? "indigo"}`}
                  >
                    <span>{page.icon}</span>
                    <ArrowRight size={17} />
                  </div>
                  <div className="recent-card-body">
                    <h3>{page.title}</h3>
                    <span>
                      Edited{" "}
                      {formatDistanceToNow(new Date(page.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {!data.recent.length && (
              <EmptyState
                title="You haven’t created any pages yet."
                action={
                  <Button onClick={() => openPage()}>
                    Create your first page
                  </Button>
                }
              />
            )}
          </section>
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>
                <CircleCheck size={18} />
                On your horizon{" "}
                <span className="subtle-count">{data.tasks.length}</span>
              </h2>
              <Link href="/workspace/tasks" className="text-link">
                All tasks
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="horizon-panel">
              {data.overdue > 0 && (
                <Link
                  className="overdue-banner"
                  href="/workspace/tasks?due=overdue"
                >
                  <Clock3 size={15} />
                  <span>
                    {data.overdue} task{data.overdue > 1 ? "s" : ""} could use a
                    little attention
                  </span>
                  <ArrowRight size={15} />
                </Link>
              )}
              {data.tasks.map((task) => (
                <div className="horizon-task" key={task.id}>
                  <TaskCheck task={task} />
                  <button
                    className="horizon-task-title"
                    onClick={() => openTask(task)}
                  >
                    <strong>{task.title}</strong>
                    <span>
                      {task.tags.map((tag) => tag.name).join(" · ") ||
                        "Personal task"}
                    </span>
                  </button>
                  <PriorityBadge priority={task.priority} />
                  <span
                    className={`due-label ${task.dueDate && task.dueDate < data.today ? "overdue-text" : ""}`}
                  >
                    {task.dueDate === data.today
                      ? "Today"
                      : dateLabel(task.dueDate)}
                  </span>
                </div>
              ))}
              {!data.tasks.length && (
                <EmptyState
                  title="You’re all caught up."
                  description="Enjoy a little breathing room, or plan what’s next."
                />
              )}
              <button className="add-task-row" onClick={() => openTask()}>
                <Plus size={16} />
                Add a task
              </button>
            </div>
          </section>
          <section className="dashboard-section">
            <div className="section-heading">
              <h2>
                <FilePlus2 size={18} />
                Recently created
              </h2>
            </div>
            <div className="created-list">
              {data.created.map((page) => (
                <Link href={`/workspace/page/${page.id}`} key={page.id}>
                  <span>{page.icon}</span>
                  <strong>{page.title}</strong>
                  <span>{format(new Date(page.createdAt), "MMM d")}</span>
                  <ChevronArrow />
                </Link>
              ))}
            </div>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <section className="quick-actions">
            <div className="section-heading">
              <h2>
                <Sparkles size={17} />
                Make a little room
              </h2>
            </div>
            <button onClick={() => openPage()}>
              <span className="quick-icon purple">
                <FilePlus2 size={18} />
              </span>
              <span>
                <strong>Write something down</strong>
                <small>A fresh page for a fresh idea</small>
              </span>
              <Plus size={15} />
            </button>
            <button onClick={() => openTask()}>
              <span className="quick-icon blue">
                <CircleCheck size={18} />
              </span>
              <span>
                <strong>Plan your next step</strong>
                <small>Turn an intention into a task</small>
              </span>
              <Plus size={15} />
            </button>
            <Link href="/workspace/templates">
              <span className="quick-icon orange">
                <LayoutTemplate size={18} />
              </span>
              <span>
                <strong>Start with a template</strong>
                <small>A little structure to get going</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          </section>
          <section className="favorites-panel">
            <div className="section-heading">
              <h2>
                <Star size={17} />
                Close at hand
              </h2>
              <span className="subtle-count">{favorites.length}</span>
            </div>
            {favorites.slice(0, 5).map((page) => (
              <Link href={`/workspace/page/${page.id}`} key={page.id}>
                <span>{page.icon}</span>
                <strong>{page.title}</strong>
                <ArrowRight size={14} />
              </Link>
            ))}
            {!favorites.length && (
              <p className="muted text-sm">
                Star the pages you return to most.
              </p>
            )}
          </section>
          <section className="progress-panel">
            <div className="progress-panel-heading">
              <span className="stat-icon purple">
                <Target size={21} />
              </span>
              <span>
                Your progress<strong>{percentage}% complete</strong>
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="Completed tasks"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
            >
              <span style={{ width: `${percentage}%` }} />
            </div>
            <p>
              {data.totalTasks
                ? `${data.completedTasks} of ${data.totalTasks} tasks completed. Every small step counts.`
                : "Your next chapter starts with a first step."}
            </p>
          </section>
          <div className="keyboard-tip">
            <kbd>⌘</kbd>
            <kbd>K</kbd>
            <span>
              Your whole workspace,
              <br />a shortcut away.
            </span>
          </div>
        </aside>
      </div>
      <footer className="dashboard-footer">
        <span>Plan your work. Organize your life.</span>
        <span>Made for your everyday.</span>
      </footer>
    </div>
  );
}
function ChevronArrow() {
  return <ArrowRight size={14} />;
}
