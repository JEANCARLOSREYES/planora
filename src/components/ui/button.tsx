import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "default" | "sm" | "icon";
  }
>(
  (
    {
      className,
      variant = "secondary",
      size = "default",
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn("btn", `btn-${variant}`, `btn-${size}`, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
