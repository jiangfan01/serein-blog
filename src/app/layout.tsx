import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { RootLayoutClient } from "@/components/layout/root-layout-client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Serein Blog",
    template: "%s | Serein Blog",
  },
  description:
    "A personal AI engineering blog for projects, notes, interview prep, and frontend architecture writeups.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-[var(--app-bg)] text-[var(--app-fg)]">
        <AppProviders>
          <SmoothScroll />
          <RootLayoutClient>{children}</RootLayoutClient>
        </AppProviders>
      </body>
    </html>
  );
}
