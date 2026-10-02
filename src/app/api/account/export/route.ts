import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/server/workspace";
import { WorkspaceError } from "@/lib/server/errors";
export async function GET() {
  try {
    const workspace = await getWorkspace();
    const data = await db.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        pages: true,
        tasks: { include: { tags: true } },
        databases: true,
        tags: true,
      },
    });
    return Response.json(
      { exportedAt: new Date().toISOString(), workspace: data },
      {
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition":
            'attachment; filename="planora-workspace.json"',
        },
      },
    );
  } catch (error) {
    return Response.json(
      { error: "Unable to export workspace." },
      { status: error instanceof WorkspaceError ? error.status : 500 },
    );
  }
}
