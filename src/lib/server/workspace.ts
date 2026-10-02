import { db } from "@/lib/db";
import { getCurrentUser } from "./current-user";

export async function getWorkspace() {
  const user = await getCurrentUser();
  return db.workspace.upsert({
    where: { ownerId: user.id },
    create: { ownerId: user.id, name: "My Workspace" },
    update: {},
  });
}
