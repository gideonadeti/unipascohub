import Link from "next/link";
import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";

import {
  footerNav,
  getCreditLine,
  siteLinks,
  siteName,
  siteTagline,
} from "@/config/site";

type SocialLink = {
  key: keyof typeof siteLinks;
  href: string;
  label: string;
  icon: IconType;
};

const socialLinks: SocialLink[] = (
  [
    {
      key: "github",
      href: siteLinks.github,
      label: "GitHub",
      icon: FaGithub,
    },
    {
      key: "twitter",
      href: siteLinks.twitter,
      label: "Twitter",
      icon: FaXTwitter,
    },
    {
      key: "linkedin",
      href: siteLinks.linkedin,
      label: "LinkedIn",
      icon: FaLinkedin,
    },
    {
      key: "buyMeACoffee",
      href: siteLinks.buyMeACoffee,
      label: "Buy Me a Coffee",
      icon: SiBuymeacoffee,
    },
  ] as const
).flatMap((link) => (link.href ? [{ ...link, href: link.href }] : []));

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <p className="text-lg font-semibold tracking-tight">{siteName}</p>
          <p className="text-sm text-muted-foreground">{siteTagline}</p>
          <p className="text-sm text-muted-foreground">
            <Link href="/contributors" className="hover:text-foreground">
              {getCreditLine()}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {siteName}
          </p>
          {socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {socialLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only">
                      {link.label} (opens in new tab)
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {footerNav.map((group) => (
          <nav key={group.title} className="space-y-3" aria-label={group.title}>
            <p className="text-sm font-medium">{group.title}</p>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.label}`}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
