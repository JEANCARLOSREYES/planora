export default function Loading() {
  return (
    <div className="content-wrap" aria-label="Loading workspace" role="status">
      <div className="skeleton h-6 w-32 mb-5" />
      <div className="skeleton h-10 w-72 mb-9" />
      <div className="grid gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((id) => (
          <div key={id} className="skeleton h-40" />
        ))}
      </div>
      <div className="skeleton h-64 mt-8" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
