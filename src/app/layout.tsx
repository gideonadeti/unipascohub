import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { EnsureUserSynced } from "@/components/ensure-user-synced";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

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
  title: "Uni Pasco Hub",
  description: "A hub to share pasco and better prepare for exams",
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
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <QueryProvider>
            <EnsureUserSynced />
            <header className="flex items-center justify-between gap-4 p-4 h-16">
              <Show when="signed-in">
                <Link
                  href="/pascos/new"
                  className="text-sm font-medium hover:underline"
                >
                  Upload Pasco
                </Link>
              </Show>
              <div className="ml-auto flex items-center gap-4">
                <Show when="signed-out">
                  <SignInButton />
                  <SignUpButton>
                    <button
                      type="button"
                      className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </header>
            {children}
            <Toaster richColors closeButton position="top-center" />
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
