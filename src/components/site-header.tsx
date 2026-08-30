"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MobileNavSheet } from "@/components/mobile-nav-sheet";
import { NotificationBell } from "@/components/notification-bell";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { siteName } from "@/config/site";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { isContributorRole, isModeratorRole } from "@/lib/pasco-permissions";
import { UserRole } from "../../generated/prisma/enums";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const currentUser = useCurrentUser();
  const userRole = currentUser.data?.user?.role;
  const showModerationLink = isModeratorRole(userRole);
  const showContributionsLink = isContributorRole(userRole);
  const showAdminLink = userRole === UserRole.ADMIN;

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:h-16 sm:px-6">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight sm:text-lg"
        aria-current={isHome ? "page" : undefined}
      >
        {siteName}
      </Link>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <div className="hidden items-center gap-2 lg:flex lg:gap-3">
          {showContributionsLink ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contributions">My contributions</Link>
            </Button>
          ) : null}
          {showAdminLink ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
          {showModerationLink ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/moderation/pascos">Pasco review</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/moderation/catalog">Catalog review</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/moderation/feedback">Feedback</Link>
              </Button>
            </>
          ) : null}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" type="button">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button type="button">Sign up</Button>
            </SignUpButton>
          </Show>
        </div>

        <ThemeToggle />
        <PwaInstallButton />

        <Show when="signed-out">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              type="button"
              className="min-h-11 lg:hidden"
            >
              Sign in
            </Button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <NotificationBell />
          <UserButton />
        </Show>

        <MobileNavSheet />
      </div>
    </header>
  );
}
