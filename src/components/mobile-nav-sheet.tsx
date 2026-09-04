"use client";

import { useAuth } from "@clerk/nextjs";
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
import { roleNavLinks } from "@/config/nav";
import { useCurrentUser } from "@/hooks/api/use-current-user";
import {
  isAdminRole,
  isContributorRole,
  isModeratorRole,
} from "@/lib/pasco-permissions";
import { cn } from "@/lib/utils";

const navLinkClassName =
  "block rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted";

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();
  const isAdmin = isAdminRole(currentUser.data?.user?.role);
  const isContributor = isContributorRole(currentUser.data?.user?.role);
  const isModerator = isModeratorRole(currentUser.data?.user?.role);

  const visibleRoleLinks = roleNavLinks.filter((link) => {
    if (link.requiresSignedIn) {
      return isSignedIn === true;
    }

    if (link.requiresAdmin) {
      return isAdmin;
    }

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
      {visibleRoleLinks.length > 0 ? (
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
      ) : null}
      <SheetContent side="right" className="w-full max-w-xs">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 pb-6">
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
