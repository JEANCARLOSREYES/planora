"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import type { AuthMode } from "@/lib/auth-mode";

type Mode = "login" | "register" | "forgot-password" | "reset-password";
const titles: Record<Mode, string> = {
  login: "Welcome back.",
  register: "Your space to make progress.",
  "forgot-password": "Reset your password.",
  "reset-password": "Choose a new password.",
};
export function AuthForm({
  mode,
  emailAvailable = false,
  authMode = "password",
}: {
  mode: Mode;
  emailAvailable?: boolean;
  authMode?: AuthMode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" href="/">
          Planora<span>Plan your work. Organize your life.</span>
        </Link>
        <h1>{titles[mode]}</h1>
        <p>
          {mode === "register"
            ? "Create your account for private notes, tasks, and plans."
            : mode === "login"
              ? "Log in to your private workspace."
              : "Use your account email to recover access."}
        </p>
        {authMode === "google" ? (
          <div>
            <p>
              Sign in securely with Google. Planora never receives your Google
              password and does not request access to your Gmail, Drive, or
              calendar.
            </p>
            {(mode === "forgot-password" || mode === "reset-password") && (
              <p>
                Recover your Google account through Google, then return here to
                sign in.
              </p>
            )}
            {(error || params.has("error")) && (
              <p role="alert" className="auth-error">
                {error || "Google sign-in was not completed. Please try again."}
              </p>
            )}
            <Button
              variant="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/workspace",
                    newUserCallbackURL: "/workspace/onboarding",
                    errorCallbackURL: "/login?error=google",
                  });
                  if (result.error) throw new Error();
                } catch {
                  setError(
                    "Google sign-in could not start. Please try again later.",
                  );
                  setBusy(false);
                }
              }}
            >
              {busy ? "Opening Google…" : "Continue with Google"}
            </Button>
            <p className="auth-hint">
              Your workspace is private to your account.{" "}
              <Link href="/privacy">How Planora handles your data</Link>.
            </p>
          </div>
        ) : message ? (
          <div role="status" className="auth-message">
            {message}
          </div>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setBusy(true);
              const data = new FormData(event.currentTarget);
              const password = String(data.get("password") ?? "");
              try {
                if (
                  (mode === "register" || mode === "reset-password") &&
                  password !== data.get("confirmPassword")
                ) {
                  setError("Passwords do not match.");
                  return;
                }
                if (mode === "register") {
                  const result = await authClient.signUp.email({
                    name: String(data.get("name")).trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    callbackURL: "/login",
                  });
                  if (result.error) {
                    setError(
                      "We could not create your account. Check your details or try again later.",
                    );
                    return;
                  }
                  setMessage(
                    emailAvailable
                      ? "Check your email to verify your account, then log in."
                      : "Your account is ready. Log in to open your private workspace.",
                  );
                } else if (mode === "login") {
                  const result = await authClient.signIn.email({
                    email: email.trim().toLowerCase(),
                    password,
                  });
                  if (result.error) {
                    setError(
                      result.error.status === 403
                        ? "Verify your email before logging in. You can request another email below."
                        : "Unable to log in. Check your email and password, or try again later.",
                    );
                    return;
                  }
                  router.replace("/workspace");
                  router.refresh();
                } else if (mode === "forgot-password") {
                  if (!emailAvailable) {
                    setError(
                      "Email recovery is not configured in this local preview.",
                    );
                    return;
                  }
                  const result = await authClient.requestPasswordReset({
                    email: email.trim().toLowerCase(),
                    redirectTo: "/reset-password",
                  });
                  if (result.error) {
                    setError(
                      "Unable to request recovery. Please try again later.",
                    );
                    return;
                  }
                  setMessage(
                    "If an account matches that email, you will receive a password reset link.",
                  );
                } else {
                  const token = params.get("token");
                  if (!token) {
                    setError("This reset link is invalid. Request a new one.");
                    return;
                  }
                  const result = await authClient.resetPassword({
                    newPassword: password,
                    token,
                  });
                  if (result.error) {
                    setError(
                      "This reset link is invalid or expired. Request a new one.",
                    );
                    return;
                  }
                  setMessage(
                    "Password updated. Your old sessions have been signed out. Log in with your new password.",
                  );
                }
              } catch {
                setError("Could not connect. Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {mode === "register" && (
              <label>
                Name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                />
              </label>
            )}
            {mode !== "reset-password" && (
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {mode !== "forgot-password" && (
              <>
                <label>
                  Password
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={mode === "login" ? 1 : 12}
                    maxLength={128}
                  />
                </label>
                <button
                  className="auth-text-button"
                  type="button"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </>
            )}
            {(mode === "register" || mode === "reset-password") && (
              <>
                <p className="auth-hint">
                  Use at least 12 characters. A unique passphrase works well.
                </p>
                <label>
                  Confirm password
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                  />
                </label>
              </>
            )}
            {mode === "register" && (
              <p className="auth-hint">
                Your workspace is private to your account. Read{" "}
                <Link href="/privacy">how Planora handles your data</Link>.
              </p>
            )}
            {error && (
              <p role="alert" className="auth-error">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" disabled={busy}>
              {busy
                ? "Please wait…"
                : mode === "register"
                  ? "Create account"
                  : mode === "login"
                    ? "Log in"
                    : mode === "forgot-password"
                      ? "Send reset link"
                      : "Save password"}
            </Button>
            {mode === "login" && emailAvailable && (
              <button
                type="button"
                className="auth-text-button"
                disabled={busy || !email}
                onClick={async () => {
                  setBusy(true);
                  setError("");
                  try {
                    const result = await authClient.sendVerificationEmail({
                      email: email.trim().toLowerCase(),
                      callbackURL: "/login",
                    });
                    if (result.error) {
                      setError(
                        "Unable to request verification. Please try again later.",
                      );
                      return;
                    }
                    setMessage(
                      "If verification is needed, a new email will arrive shortly.",
                    );
                  } catch {
                    setError("Could not connect. Try again.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Resend verification email
              </button>
            )}
          </form>
        )}
        <nav className="auth-links" aria-label="Account navigation">
          {mode !== "login" && <Link href="/login">Log in</Link>}
          {mode === "login" && (
            <>
              <Link href="/register">Create an account</Link>
              {authMode === "password" && (
                <Link href="/forgot-password">Forgot password?</Link>
              )}
            </>
          )}
          {mode === "reset-password" && (
            <Link href="/forgot-password">Request a new reset link</Link>
          )}
          <Link href="/privacy">Privacy</Link>
        </nav>
      </section>
    </main>
  );
}
