"use client";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

export function Menu({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          className="dropdown-content"
          align="end"
          sideOffset={6}
        >
          {children}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
export function MenuItem({
  children,
  onSelect,
  danger = false,
  disabled = false,
}: {
  children: ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Dropdown.Item
      className={`dropdown-item ${danger ? "danger-text" : ""}`}
      onSelect={onSelect}
      disabled={disabled}
    >
      {children}
    </Dropdown.Item>
  );
}
export function MenuSeparator() {
  return <Dropdown.Separator className="dropdown-separator" />;
}
