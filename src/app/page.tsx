import Link from "next/link";
import { FileText, CalendarDays, ListTodo, LockKeyhole } from "lucide-react";
export default function Index() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="auth-brand" href="/">
          Planora
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/login">Log in</Link>
          <Link className="landing-cta" href="/register">
            Create account
          </Link>
        </nav>
      </header>
      <section className="landing-hero">
        <p className="landing-eyebrow">
          A little clarity. A lot of possibility.
        </p>
        <h1>
          Your ideas, your plans.
          <br />
          <span>Your own space.</span>
        </h1>
        <p>
          Bring your notes, tasks, and everyday plans together. Make room for
          what matters, one small step at a time.
        </p>
        <div className="landing-actions">
          <Link className="landing-cta" href="/register">
            Make space for your next idea
          </Link>
          <Link href="/login">Open your workspace →</Link>
        </div>
        <p className="landing-detail">
          <LockKeyhole size={16} aria-hidden="true" /> Your account. Your
          private workspace. No public sharing.
        </p>
      </section>
      <section
        className="landing-features"
        aria-label="What you can do with Planora"
      >
        {[
          {
            icon: FileText,
            title: "Think it through",
            text: "Rich notes, nested pages, and useful templates for ideas worth keeping.",
          },
          {
            icon: ListTodo,
            title: "Move it forward",
            text: "Organize tasks by priority, deadline, and collection. Switch between lists and boards.",
          },
          {
            icon: CalendarDays,
            title: "See the bigger picture",
            text: "A calendar and dashboard help you see what is coming and what needs your attention.",
          },
        ].map((feature) => (
          <article key={feature.title}>
            <feature.icon size={24} aria-hidden="true" />
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
      <footer className="landing-footer">
        <span>Plan your work. Organize your life.</span>
        <Link href="/privacy">Privacy and account controls</Link>
      </footer>
    </main>
  );
}
