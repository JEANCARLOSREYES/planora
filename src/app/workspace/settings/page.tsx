import { SettingsPanel } from "@/components/settings/settings-panel";
import { getWorkspace } from "@/lib/server/workspace";
import { AccountPanel } from "@/components/auth/account-panel";
import { getCurrentUser } from "@/lib/server/current-user";
export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const workspace = await getWorkspace();
  const user = await getCurrentUser();
  return (
    <>
      <AccountPanel email={user.email} />
      <SettingsPanel workspaceName={workspace.name} />
    </>
  );
}
