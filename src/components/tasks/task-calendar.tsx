"use client";
import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CalendarOff } from "lucide-react";
import { useWorkspace } from "@/components/layout/workspace-context";
import { Button } from "@/components/ui/button";
import { todayKey } from "@/lib/utils";
import type { TaskRecord } from "@/lib/types";

export function TaskCalendar({
  tasks,
  onCreate,
}: {
  tasks: TaskRecord[];
  onCreate: (dueDate?: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const { openTask } = useWorkspace();
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  const byDate = new Map<string, TaskRecord[]>();
  for (const task of tasks)
    if (task.dueDate)
      byDate.set(task.dueDate, [...(byDate.get(task.dueDate) ?? []), task]);
  const undated = tasks.filter((task) => !task.dueDate);
  return (
    <div className="calendar-view">
      <div className="calendar-toolbar">
        <h2 aria-live="polite">{format(month, "MMMM yyyy")}</h2>
        <div>
          <Button size="sm" onClick={() => setMonth(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => setMonth(addMonths(month, -1))}
          >
            <ChevronLeft size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next month"
            onClick={() => setMonth(addMonths(month, 1))}
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>
      <div className="calendar-scroll">
        <div
          className="calendar-grid"
          role="grid"
          aria-label={format(month, "MMMM yyyy")}
        >
          <div className="calendar-weekdays" role="row">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <div key={day} role="columnheader">
                <span className="full-weekday">{day}</span>
                <span className="short-weekday">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          {Array.from({ length: days.length / 7 }, (_, week) => (
            <div role="row" className="calendar-week" key={week}>
              {days.slice(week * 7, week * 7 + 7).map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayTasks = byDate.get(key) ?? [];
                return (
                  <div
                    role="gridcell"
                    aria-label={format(day, "MMMM d, yyyy")}
                    key={key}
                    className={`calendar-day ${isSameMonth(day, month) ? "" : "outside-month"} ${key === todayKey() ? "today" : ""}`}
                  >
                    <div className="calendar-day-header">
                      <span>{format(day, "d")}</span>
                      <button
                        aria-label={`Create task for ${format(day, "MMMM d, yyyy")}`}
                        onClick={() => onCreate(key)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    {dayTasks.map((task) => (
                      <button
                        key={task.id}
                        className={`calendar-task status-${task.status.toLowerCase()}`}
                        onClick={() => openTask(task)}
                        title={task.title}
                      >
                        <span
                          className={`calendar-task-dot priority-${task.priority.toLowerCase()}`}
                        />
                        {task.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {undated.length > 0 && (
        <section className="undated-tasks">
          <h3>
            <CalendarOff size={16} />
            Without a due date{" "}
            <span className="subtle-count">{undated.length}</span>
          </h3>
          <div>
            {undated.map((task) => (
              <button key={task.id} onClick={() => openTask(task)}>
                {task.title}
                <Plus size={13} />
              </button>
            ))}
          </div>
        </section>
      )}
      <p className="view-hint">
        Select a task to edit it. Use the + on a day to plan something new.
      </p>
    </div>
  );
}
