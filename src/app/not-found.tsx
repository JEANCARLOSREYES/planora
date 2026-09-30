import Link from "next/link";
import { Logo } from "@/components/layout/logo";
export default function NotFound() {
  return (
    <div className="full-state">
      <Logo />
      <p className="eyebrow">404 · A little off the path</p>
      <h1>This page isn’t here.</h1>
      <p>
        It may have been deleted or moved. Your workspace is a good place to
        start again.
      </p>
      <Link className="btn btn-primary" href="/workspace">
        Back to workspace
      </Link>
    </div>
  );
}
