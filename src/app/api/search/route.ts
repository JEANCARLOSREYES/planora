import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/server/workspace";
import { WorkspaceError } from "@/lib/server/errors";

export async function GET(request: NextRequest) {
  const query =
    request.nextUrl.searchParams.get("q")?.trim().slice(0, 200) ?? "";
  try {
    const workspace = await getWorkspace();
    if (!query) return NextResponse.json({ pages: [], tasks: [], tags: [] });
    const [pages, tasks, tags] = await Promise.all([
      db.page.findMany({
        where: {
          workspaceId: workspace.id,
          OR: [
            { title: { contains: query } },
            { plainText: { contains: query } },
          ],
        },
        select: { id: true, title: true, icon: true, plainText: true },
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
      db.task.findMany({
        where: {
          workspaceId: workspace.id,
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { tags: { some: { name: { contains: query } } } },
          ],
        },
        select: { id: true, title: true, status: true },
        take: 8,
        orderBy: { updatedAt: "desc" },
      }),
      db.tag.findMany({
        where: {
          workspaceId: workspace.id,
          name: { contains: query },
          tasks: { some: {} },
        },
        select: { id: true, name: true },
        take: 5,
      }),
    ]);
    return NextResponse.json({
      pages: pages.map((page) => {
        const index = page.plainText.toLowerCase().indexOf(query.toLowerCase());
        return {
          id: page.id,
          title: page.title,
          icon: page.icon,
          excerpt: page.plainText.slice(
            Math.max(0, index - 25),
            Math.max(0, index - 25) + 100,
          ),
        };
      }),
      tasks,
      tags,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Search is unavailable. Please try again." },
      { status: error instanceof WorkspaceError ? error.status : 500 },
    );
  }
}
