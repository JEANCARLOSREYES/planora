"use client";
import { Button } from "@/components/ui/button";
export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="full-state">
      <h1>Let’s try that again.</h1>
      <p>
        We couldn’t load this view. Check that your local database is set up,
        then try again.
      </p>
      <Button onClick={reset} variant="primary">
        Try again
      </Button>
    </div>
  );
}
