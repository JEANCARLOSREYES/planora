import { getSidebarData } from "@/lib/server/queries";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getCurrentUser } from "@/lib/server/current-user";
import { WorkspaceError } from "@/lib/server/errors";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await getCurrentUser();
  } catch (error) {
    if (error instanceof WorkspaceError && error.status === 401)
      redirect("/login");
    throw error;
  }
  const data = await getSidebarData();
  return <WorkspaceShell {...data}>{children}</WorkspaceShell>;
}
