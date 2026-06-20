"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavLinkActive, primaryBottomNav } from "@/config/nav";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {primaryBottomNav.map((item) => {
          const active = isNavLinkActive(pathname, item.href, item.matchPaths);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
