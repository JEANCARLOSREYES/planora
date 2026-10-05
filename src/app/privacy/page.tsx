import Link from "next/link";
export const metadata = { title: "Privacy" };
export default function PrivacyPage() {
  return (
    <main className="auth-page">
      <article className="auth-card privacy-copy">
        <Link className="auth-brand" href="/login">
          Planora
        </Link>
        <h1>Your account and your data</h1>
        <p>
          Planora stores your name, email, notes, tasks, and workspace settings.
          Google sign-in supplies your basic profile and verified email, never
          your Google password. It requests no Gmail, Drive, or calendar access.
          Login tokens are encrypted before database storage. Local password
          accounts store a password hash, not a plaintext password.
        </p>
        <h2>Private workspaces</h2>
        <p>
          Application access is restricted to the account that owns each
          workspace. There is no public sharing feature. Database operators can
          access stored data; notes are not end-to-end encrypted.
        </p>
        <h2>Sessions and recovery</h2>
        <p>
          An essential HTTP-only cookie keeps you logged in. Sessions expire
          after seven days. Session records can include an IP address and
          browser identifier for security. Verification and password recovery
          emails are available only in password mode with an email provider.
          Google accounts use Google account recovery instead.
        </p>
        <h2>Device drafts</h2>
        <p>
          The editor saves recovery drafts on your device. Signing out clears
          Planora draft storage. Close other Planora tabs before signing out on
          a shared device.
        </p>
        <h2>Your controls</h2>
        <p>
          Account settings let you export your workspace, sign out other
          sessions, or delete your account and its workspace. Exports contain
          private content: keep downloaded files safe. Google users manage
          passwords through Google; deleting a Planora account requires a
          sign-in from within the last five minutes.
        </p>
        <h2>AI features</h2>
        <p>
          This release has no AI assistant and sends no notes or tasks to
          OpenAI. AI services are excluded from the free launch.
        </p>
        <h2>Before public launch</h2>
        <p>
          The operator must publish the final hosting and email providers,
          backup retention and deletion schedule, and a privacy contact before
          inviting public users. This development notice does not promise a
          retention policy that has not been configured.
        </p>
        <Link href="/register">Create an account</Link>
      </article>
    </main>
  );
}
