import { db } from "@/lib/db";
import { addDays, format } from "date-fns";
import { templateContent, welcomeContent } from "@/lib/templates";
import { extractText } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

export async function seedWorkspace(
  reset = false,
  ownerId: string | null = null,
) {
  return db.$transaction(async (tx) => {
    const existing = await tx.workspace.findFirst({ where: { ownerId } });
    if (existing && !reset) return existing;
    if (reset && existing)
      await tx.workspace.delete({ where: { id: existing.id } });
    const workspace = await tx.workspace.create({
      data: { name: "My Workspace", ownerId },
    });
    const notes = [
      {
        title: "Welcome to Planora",
        icon: "👋",
        cover: "indigo",
        content: welcomeContent,
        favorite: true,
      },
      {
        title: "Semester Planner",
        icon: "🎓",
        cover: "ocean",
        content: templateContent("study"),
        favorite: true,
      },
      {
        title: "Career Goals",
        icon: "🌱",
        cover: "forest",
        content: templateContent("project"),
        favorite: false,
      },
      {
        title: "Project Ideas",
        icon: "💡",
        cover: "sunrise",
        content: templateContent("project"),
        favorite: true,
      },
      {
        title: "Meeting Notes",
        icon: "💬",
        cover: "rose",
        content: templateContent("meeting"),
        favorite: false,
      },
    ];
    for (const [position, note] of notes.entries()) {
      const page = await tx.page.create({
        data: {
          ...note,
          content: note.content as Prisma.InputJsonValue,
          plainText: extractText(note.content),
          position,
          workspaceId: workspace.id,
        },
      });
      if (position === 1)
        await tx.page.create({
          data: {
            title: "Weekly study plan",
            icon: "📚",
            parentId: page.id,
            workspaceId: workspace.id,
            content: templateContent("weekly") as Prisma.InputJsonValue,
            plainText: extractText(templateContent("weekly")),
          },
        });
    }
    const database = await tx.database.create({
      data: {
        name: "Personal projects",
        description:
          "Ideas in motion. Keep your projects moving, one task at a time.",
        workspaceId: workspace.id,
      },
    });
    const tasks = [
      {
        title: "Finish analytics assignment",
        priority: "HIGH",
        status: "IN_PROGRESS",
        day: 0,
        tag: "university",
      },
      {
        title: "Update GitHub portfolio",
        priority: "HIGH",
        status: "NOT_STARTED",
        day: 1,
        tag: "career",
      },
      {
        title: "Review finance notes",
        priority: "MEDIUM",
        status: "NOT_STARTED",
        day: -1,
        tag: "university",
      },
      {
        title: "Work on coding project",
        priority: "MEDIUM",
        status: "IN_PROGRESS",
        day: 2,
        tag: "personal",
      },
      {
        title: "Prepare weekly schedule",
        priority: "LOW",
        status: "COMPLETED",
        day: 0,
        tag: "personal",
      },
    ] as const;
    for (const task of tasks)
      await tx.task.create({
        data: {
          title: task.title,
          priority: task.priority,
          status: task.status,
          dueDate: format(addDays(new Date(), task.day), "yyyy-MM-dd"),
          completedAt: task.status === "COMPLETED" ? new Date() : null,
          workspaceId: workspace.id,
          databaseId:
            task.tag === "career" || task.title === "Work on coding project"
              ? database.id
              : null,
          tags: {
            connectOrCreate: {
              where: {
                workspaceId_name: { workspaceId: workspace.id, name: task.tag },
              },
              create: { workspaceId: workspace.id, name: task.tag },
            },
          },
        },
      });
    return workspace;
  });
}
