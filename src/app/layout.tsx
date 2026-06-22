import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { EnsureUserSynced } from "@/components/ensure-user-synced";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaInstallPill } from "@/components/pwa-install-pill";
import { ScrollToTop } from "@/components/scroll-to-top";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkipToContent } from "@/components/skip-to-content";
import { Toaster } from "@/components/ui/sonner";
import { siteDescription, siteName } from "@/config/site";

import "./globals.css";

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
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL("https://unipascohub.com"),
  icons: {
    icon: "/favicon.ico",
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
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
      <body className="flex min-h-full flex-col">
        <SkipToContent />
        <ClerkProvider>
          <ThemeProvider>
            <QueryProvider>
              <EnsureUserSynced />
              <SiteHeader />
              <div className="flex flex-1 flex-col">{children}</div>
              <SiteFooter />
              <MobileBottomNav />
              <ScrollToTop />
              <PwaInstallPill />
              <Toaster richColors closeButton position="top-center" />
            </QueryProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
