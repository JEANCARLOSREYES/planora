import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Log in" };
export const dynamic = "force-dynamic";
export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm
        mode="login"
        emailAvailable={Boolean(
          process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM,
        )}
      />
    </Suspense>
  );
}
