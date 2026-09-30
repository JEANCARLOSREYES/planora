import type { AnchorHTMLAttributes } from "react";
import { useRouter } from "./navigation";
export default function Link({
  href,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const router = useRouter();
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          href.startsWith("/") &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0 &&
          props.target !== "_blank"
        ) {
          event.preventDefault();
          router.push(href);
        }
      }}
    />
  );
}
