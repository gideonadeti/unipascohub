"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteName } from "@/config/site";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { isModeratorRole } from "@/lib/pasco-permissions";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const currentUser = useCurrentUser();
  const showModerationLink = isModeratorRole(currentUser.data?.user?.role);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:h-16 sm:px-6">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight sm:text-lg"
        aria-current={isHome ? "page" : undefined}
      >
        <span className="sm:hidden">Uni Pasco</span>
        <span className="hidden sm:inline">{siteName}</span>
      </Link>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {showModerationLink ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/moderation/pascos">Moderation</Link>
          </Button>
        ) : null}
        <ThemeToggle />
        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              type="button"
              className="min-h-11 px-3 sm:min-h-0 sm:px-4"
            >
              Sign in
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button type="button" className="min-h-11 px-3 sm:min-h-0 sm:px-4">
              Sign up
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <NotificationBell />
          <UserButton />
        </Show>
      </div>
    </header>
  );
}
