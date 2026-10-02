import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { WorkspaceError } from "./errors";

export async function getCurrentUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) throw new WorkspaceError("Please log in to continue.", 401);
  return session.user;
}
