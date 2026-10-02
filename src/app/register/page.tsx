import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
export const metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";
export default function RegisterPage() {
  return (
    <Suspense>
      <AuthForm
        mode="register"
        emailAvailable={Boolean(
          process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM,
        )}
      />
    </Suspense>
  );
}
