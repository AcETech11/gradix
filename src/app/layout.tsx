import type { Metadata } from "next";
import { Urbanist } from 'next/font/google'
import "./globals.css";


const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-urbanist',
  //display: 'swap',
})

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
    <html lang="en" className={urbanist.variable}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
