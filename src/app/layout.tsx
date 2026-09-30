import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Planora — Plan your work. Organize your life.",
    template: "%s · Planora",
  },
  description:
    "A thoughtful local workspace for notes, tasks, and everything you are working toward.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
