"use client";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Palette,
  LayoutGrid,
  Database,
  RotateCcw,
  Keyboard,
} from "lucide-react";
import { toast } from "sonner";
import { updateWorkspaceAction, resetWorkspaceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

const subscribe = () => () => {};
export function SettingsPanel({ workspaceName }: { workspaceName: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [name, setName] = useState(workspaceName);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="content-wrap settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="accent-dot" />
            MAKE YOURSELF AT HOME
          </div>
          <h1>Your workspace, your way.</h1>
          <p>A few thoughtful details to make Planora feel like you.</p>
        </div>
      </div>
      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="stat-icon purple">
            <Palette size={20} />
          </span>
          <div>
            <h2>Appearance</h2>
            <p>Find the right light for your ideas.</p>
          </div>
        </div>
        <div className="theme-options" role="group" aria-label="Appearance">
          {[
            { id: "light", title: "Light", icon: Sun },
            { id: "dark", title: "Dark", icon: Moon },
            { id: "system", title: "System", icon: Monitor },
          ].map((option) => (
            <button
              key={option.id}
              aria-pressed={mounted && theme === option.id}
              onClick={() => setTheme(option.id)}
            >
              <div className={`theme-preview theme-preview-${option.id}`}>
                <div className="theme-preview-sidebar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="theme-preview-content">
                  <span />
                  <span />
                  <div>
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <span className="theme-option-label">
                <option.icon size={16} />
                {option.title}
                {mounted && theme === option.id && <Check size={16} />}
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="stat-icon blue">
            <LayoutGrid size={20} />
          </span>
          <div>
            <h2>Workspace</h2>
            <p>A name for everything you’re working toward.</p>
          </div>
        </div>
        <form
          className="workspace-settings-form"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await updateWorkspaceAction({ name });
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              toast.success("Settings saved");
            });
          }}
        >
          <label>
            Workspace name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={80}
            />
          </label>
          <Button
            variant="primary"
            type="submit"
            disabled={pending || name.trim() === workspaceName}
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="stat-icon purple">
            <Keyboard size={20} />
          </span>
          <div>
            <h2>A few useful shortcuts</h2>
            <p>Stay in your flow.</p>
          </div>
        </div>
        <div className="shortcut-list">
          <div>
            <span>Search & command palette</span>
            <kbd>⌘ / Ctrl + K</kbd>
          </div>
          <div>
            <span>Bold, italic & underline</span>
            <kbd>⌘ / Ctrl + B / I / U</kbd>
          </div>
          <div>
            <span>Insert a block</span>
            <kbd>/</kbd>
          </div>
          <div>
            <span>Undo / Redo</span>
            <kbd>⌘ / Ctrl + Z / Shift + Z</kbd>
          </div>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading">
          <span className="stat-icon orange">
            <Database size={20} />
          </span>
          <div>
            <h2>Your data</h2>
            <p>Your pages and tasks belong to your own workspace.</p>
          </div>
        </div>
        <div className="reset-data-card">
          <div>
            <h3>Start fresh with demo content</h3>
            <p>
              Replace the pages, tasks, tags, and collections in your workspace
              with sample content. Other accounts are not affected.
            </p>
          </div>
          <Button
            onClick={() => {
              setConfirmation("");
              setError("");
              setResetOpen(true);
            }}
          >
            <RotateCcw size={15} />
            Reset demo
          </Button>
        </div>
      </section>
      <div className="settings-footer">
        Planora 1.0 · A little clarity, every day.
      </div>
      <Dialog
        open={resetOpen}
        onOpenChange={(open) => !pending && setResetOpen(open)}
        title="Start fresh?"
        description="This permanently deletes all workspace data and restores the demo. This cannot be undone. Type RESET to continue."
      >
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await resetWorkspaceAction(confirmation);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              for (const key of Object.keys(localStorage))
                if (key.startsWith("planora:draft:"))
                  localStorage.removeItem(key);
              toast.success("Demo workspace restored");
              setResetOpen(false);
              router.push("/workspace");
              router.refresh();
            });
          }}
        >
          <label>
            Confirmation
            <input
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="RESET"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            <Button disabled={pending} onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={confirmation !== "RESET" || pending}
            >
              {pending ? "Resetting…" : "Reset workspace"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
