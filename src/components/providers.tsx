"use client";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import type { ReactNode } from "react";
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <WorkspaceToaster />
    </ThemeProvider>
  );
}

function WorkspaceToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
    />
  );
}
