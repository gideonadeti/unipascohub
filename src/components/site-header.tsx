"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteName } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:h-16 sm:px-6">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight sm:text-lg"
      >
        <span className="sm:hidden">Uni Pasco</span>
        <span className="hidden sm:inline">{siteName}</span>
      </Link>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button variant="ghost" size="sm" type="button">
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button size="sm" type="button">
              Sign up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
