"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/storage", label: "Storage" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/users", label: "Users" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex gap-1 border-b">
      {adminNavItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "rounded-b-none border-b-2 px-4 pb-3 pt-2 hover:bg-transparent",
              isActive
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
