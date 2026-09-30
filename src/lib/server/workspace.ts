import { db } from "@/lib/db";

export async function getWorkspace() {
  const workspace = await db.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!workspace)
    throw new Error(
      "Your workspace is not initialized. Run npm run db:setup, then reload.",
    );
  return workspace;
}
