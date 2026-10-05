"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { clearPlanoraDrafts } from "@/lib/client-privacy";
import { Button } from "@/components/ui/button";
import type { AuthMode } from "@/lib/auth-mode";
export function AccountPanel({
  email,
  authMode = "password",
}: {
  email: string;
  authMode?: AuthMode;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="content-wrap auth-account">
      <h2>Account and security</h2>
      <p>{email}</p>
      <div className="auth-links">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await authClient.signOut();
              if (result.error) throw new Error();
              clearPlanoraDrafts();
              // Drop the authenticated router cache on this shared device.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/login");
            } catch {
              setError("Could not sign out. Try again.");
              setBusy(false);
            }
          }}
        >
          Log out
        </Button>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const result = await authClient.revokeOtherSessions();
              if (result.error) throw new Error();
              setMessage("Other sessions have been signed out.");
            } catch {
              setError("Could not sign out other sessions.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Sign out other devices
        </Button>
        <a href="/api/account/export">Export my workspace</a>
      </div>
      {authMode === "google" ? (
        <p>
          Your login is managed by Google. Change your password or recover
          access in your Google account settings.
        </p>
      ) : (
        <form
          className="workspace-settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            setBusy(true);
            setError("");
            setMessage("");
            if (data.get("newPassword") !== data.get("confirmPassword")) {
              setError("Passwords do not match.");
              setBusy(false);
              return;
            }
            try {
              const result = await authClient.changePassword({
                currentPassword: String(data.get("currentPassword")),
                newPassword: String(data.get("newPassword")),
                revokeOtherSessions: true,
              });
              if (result.error) {
                setError(
                  "Could not update your password. Check your current password and try again.",
                );
                return;
              }
              form.reset();
              setMessage(
                "Password updated. Other sessions have been signed out.",
              );
            } catch {
              setError("Could not connect. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Current password
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          <label>
            New password
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
          <Button type="submit" disabled={busy}>
            Change password
          </Button>
        </form>
      )}
      <details>
        <summary>Delete account</summary>
        <p>
          This permanently deletes your account and all pages, tasks, and
          collections in your workspace. Export anything you want to keep first.
        </p>
        {authMode === "google" && (
          <p>
            For security, sign in within the last five minutes before deleting.
            If needed, log out and sign in with Google again, then return here.
          </p>
        )}
        <form
          className="workspace-settings-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            if (data.get("confirmation") !== "DELETE") {
              setError("Type DELETE to confirm.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const result = await authClient.deleteUser(
                authMode === "google"
                  ? {}
                  : {
                      password: String(data.get("password")),
                    },
              );
              if (result.error) {
                setError(
                  authMode === "google"
                    ? "Could not delete your account. Log out, sign in with Google again, and retry within five minutes."
                    : "Could not delete your account. Check your password and try again.",
                );
                return;
              }
              clearPlanoraDrafts();
              // Drop cached private content after account deletion.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/register");
            } catch {
              setError("Could not connect. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {authMode === "password" && (
            <label>
              Account password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
          )}
          <label>
            Type DELETE
            <input name="confirmation" required pattern="DELETE" />
          </label>
          <Button variant="danger" type="submit" disabled={busy}>
            Delete my account and workspace
          </Button>
        </form>
      </details>
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
