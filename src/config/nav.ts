import type { LucideIcon } from "lucide-react";
import { Home, Search, Upload } from "lucide-react";

import type { FooterLink } from "@/config/site";

export type NavLink = FooterLink;

export type BottomNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  matchPaths?: string[];
};

export const primaryBottomNav: BottomNavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    matchPaths: ["/"],
  },
  {
    label: "Browse",
    href: "/pascos",
    icon: Search,
    matchPaths: ["/pascos"],
  },
  {
    label: "Upload",
    href: "/pascos/new",
    icon: Upload,
    matchPaths: ["/pascos/new"],
  },
];

export type RoleNavLink = {
  label: string;
  href: string;
  requiresContributor?: boolean;
  requiresModerator?: boolean;
};

export const roleNavLinks: RoleNavLink[] = [
  {
    label: "My contributions",
    href: "/contributions",
    requiresContributor: true,
  },
  {
    label: "Pasco review",
    href: "/moderation/pascos",
    requiresModerator: true,
  },
  {
    label: "Catalog review",
    href: "/moderation/catalog",
    requiresModerator: true,
  },
  {
    label: "Feedback",
    href: "/moderation/feedback",
    requiresModerator: true,
  },
];

export function isNavLinkActive(
  pathname: string,
  href: string,
  matchPaths?: string[],
): boolean {
  if (matchPaths) {
    return matchPaths.some((path) => {
      if (path === "/") {
        return pathname === "/";
      }

      return pathname === path || pathname.startsWith(`${path}/`);
    });
  }

  if (href === "/") {
    return pathname === "/";
  }

  const basePath = href.split("#")[0] ?? href;
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}
