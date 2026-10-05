export type AuthMode = "password" | "google";

// Only the mode crosses into UI props; provider credentials remain server-only.
export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE || "password";
  if (mode !== "password" && mode !== "google")
    throw new Error("AUTH_MODE must be password or google.");
  return mode;
}

export function isPasswordEndpoint(path: string) {
  return [
    "/sign-up/email",
    "/sign-in/email",
    "/request-password-reset",
    "/reset-password",
    "/change-password",
    "/set-password",
    "/send-verification-email",
    "/verify-email",
  ].includes(path);
}
