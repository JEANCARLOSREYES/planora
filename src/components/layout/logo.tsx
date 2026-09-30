import { cn } from "@/lib/utils";
export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("logo", className)}>
      <svg width="30" height="32" viewBox="0 0 30 32" aria-hidden="true">
        <path
          d="M4 29V4h12c7 0 11 4 11 10S23 24 16 24h-5v5Z"
          fill="currentColor"
        />
        <path d="M11 10h5a4 4 0 0 1 0 8h-5Z" fill="var(--sidebar)" />
        <path d="M11 24h6l-6 5Z" fill="var(--sidebar)" opacity=".7" />
      </svg>
      {!compact && (
        <span>
          planora<span className="logo-dot">.</span>
        </span>
      )}
    </span>
  );
}
