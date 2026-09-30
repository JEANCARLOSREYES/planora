import { getSidebarData } from "@/lib/server/queries";
import { WorkspaceShell } from "@/components/layout/workspace-shell";

export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getSidebarData();
  return <WorkspaceShell {...data}>{children}</WorkspaceShell>;
}
