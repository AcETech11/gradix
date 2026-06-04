import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Gradix",
    template: "%s | Gradix",
  },
  description: "A focused operating system for learning progress and academic workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background font-sans text-foreground" suppressHydrationWarning>{children}</body>
    </html>
  );
}
