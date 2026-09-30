import { SettingsPanel } from "@/components/settings/settings-panel";
import { getWorkspace } from "@/lib/server/workspace";
export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const workspace = await getWorkspace();
  return <SettingsPanel workspaceName={workspace.name} />;
}
