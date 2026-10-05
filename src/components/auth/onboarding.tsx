"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWorkspaceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function Onboarding({ workspaceName }: { workspaceName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="content-wrap">
      <h1>Make yourself at home.</h1>
      <p>
        Your new workspace is private to your account. Start with a name—you can
        customize colors, fonts, and light or dark mode in Settings.
      </p>
      <form
        className="workspace-settings-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const name = String(
            new FormData(event.currentTarget).get("name") ?? "",
          ).trim();
          setBusy(true);
          setError("");
          try {
            const result = await updateWorkspaceAction({ name });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.replace("/workspace");
            router.refresh();
          } catch {
            setError("Could not save your workspace name. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Workspace name
          <input
            name="name"
            defaultValue={workspaceName}
            required
            minLength={1}
            maxLength={80}
          />
        </label>
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? "Saving…" : "Open my workspace"}
        </Button>
      </form>
    </section>
  );
}
