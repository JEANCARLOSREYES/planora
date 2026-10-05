import { getWorkspace } from "@/lib/server/workspace";
import { Onboarding } from "@/components/auth/onboarding";

export const metadata = { title: "Welcome to Planora" };
export default async function OnboardingPage() {
  const workspace = await getWorkspace();
  return <Onboarding workspaceName={workspace.name} />;
}
