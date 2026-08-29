"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { roleNavLinks, sheetNavGroups } from "@/config/nav";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import { isContributorRole, isModeratorRole } from "@/lib/pasco-permissions";
import { cn } from "@/lib/utils";

const navLinkClassName =
  "block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted";

function hasHashFragment(href: string): boolean {
  return href.includes("#");
}

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentUser = useCurrentUser();
  const isContributor = isContributorRole(currentUser.data?.user?.role);
  const isModerator = isModeratorRole(currentUser.data?.user?.role);

  const visibleRoleLinks = roleNavLinks.filter((link) => {
    if (link.requiresModerator) {
      return isModerator;
    }

    if (link.requiresContributor) {
      return isContributor;
    }

    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6">
          {visibleRoleLinks.length > 0 ? (
            <nav aria-label="Account" className="space-y-1">
              <p className="px-3 text-xs font-medium text-muted-foreground">
                Account
              </p>
              {visibleRoleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    navLinkClassName,
                    pathname.startsWith(link.href) &&
                      "bg-muted font-medium text-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}

          {sheetNavGroups.map((group) => (
            <nav
              key={group.title}
              aria-label={group.title}
              className="space-y-1"
            >
              <p className="px-3 text-xs font-medium text-muted-foreground">
                {group.title}
              </p>
              {group.links.map((link) => {
                const basePath = link.href.split("#")[0] ?? link.href;
                const active =
                  !hasHashFragment(link.href) &&
                  (pathname === basePath ||
                    pathname.startsWith(`${basePath}/`));

                if (link.external) {
                  return (
                    <a
                      key={`${group.title}-${link.label}`}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={navLinkClassName}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  );
                }

                if (hasHashFragment(link.href)) {
                  return (
                    <a
                      key={`${group.title}-${link.label}`}
                      href={link.href}
                      className={navLinkClassName}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={`${group.title}-${link.label}`}
                    href={link.href}
                    className={cn(
                      navLinkClassName,
                      active && "bg-muted font-medium text-foreground",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          ))}

          <Show when="signed-out">
            <div className="flex flex-col gap-2">
              <SignInButton mode="modal">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  type="button"
                  className="w-full min-h-11"
                  onClick={() => setOpen(false)}
                >
                  Sign up
                </Button>
              </SignUpButton>
            </div>
          </Show>
        </div>
      </SheetContent>
    </Sheet>
  );
}
