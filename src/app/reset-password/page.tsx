import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { getAuthMode } from "@/lib/auth-mode";
export const metadata = { title: "Set a new password" };
export const dynamic = "force-dynamic";
export default function ResetPasswordPage() {
  return (
    <Suspense>
      <AuthForm mode="reset-password" authMode={getAuthMode()} />
    </Suspense>
  );
}
