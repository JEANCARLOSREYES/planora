import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Recover your account" };
export const dynamic = "force-dynamic";
export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <AuthForm
        mode="forgot-password"
        emailAvailable={Boolean(
          process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM,
        )}
      />
    </Suspense>
  );
}
