import type { Metadata } from "next";

import "./globals.css";

import { AppShell } from "@/components/AppShell";

const themeInitializer = `
  try {
    const saved = localStorage.getItem("learnly-theme");
    const theme = saved === "light" || saved === "dark" ? saved : "dark";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
`;

export const metadata: Metadata = {
  title: { default: "Learnly", template: "%s · Learnly" },
  description: "Turn handwritten notes into an intelligent learning library.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
