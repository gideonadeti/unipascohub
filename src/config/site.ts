export type SiteContributor = {
  name: string;
  url?: string;
};

export type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type FooterNavGroup = {
  title: string;
  links: FooterLink[];
};

export const siteName = "Uni Pasco Hub";

export const siteTagline =
  "Find and share past exam papers to prepare with confidence.";

export const siteDescription =
  "A hub for university students to share pasco and better prepare for exams.";

export const siteCredits = {
  lead: "Gideon Adeti",
  contributors: [] as SiteContributor[],
};

export function getCreditLine(): string {
  if (siteCredits.contributors.length === 0) {
    return `Engineered by ${siteCredits.lead}`;
  }

  return `Engineered by ${siteCredits.lead} and contributors`;
}

function readPublicUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export const siteLinks = {
  buyMeACoffee: readPublicUrl(process.env.NEXT_PUBLIC_BMC_URL),
  github: readPublicUrl(process.env.NEXT_PUBLIC_GITHUB_URL),
  twitter: readPublicUrl(process.env.NEXT_PUBLIC_TWITTER_URL),
  linkedin: readPublicUrl(process.env.NEXT_PUBLIC_LINKEDIN_URL),
  feedback: readPublicUrl(process.env.NEXT_PUBLIC_FEEDBACK_URL),
} as const;

export const footerNav: FooterNavGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Browse pascos", href: "/pascos" },
      { label: "Upload pasco", href: "/pascos/new" },
      { label: "Contributors", href: "/contributors" },
      { label: "Sponsors", href: "/sponsors" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Feedback", href: "/feedback#feedback" },
      { label: "Report an issue", href: "/feedback#report" },
      { label: "Testimonials", href: "/feedback#testimonials" },
    ],
  },
];

export const heroCopy = {
  headline: siteName,
  subheadline: siteTagline,
  searchAriaLabel: "Search pascos",
} as const;

export const heroSearchExamples = [
  "ATU 111",
  "UG DCIT 101",
  "DCIT 101 level 200",
  "DCIT 101 2024/2025",
  "Level 100",
  "2025",
  "2025/2026",
  "Mid sem",
  "End of sem",
  "sem 1",
  "resit",
  "africa and world development",
  "KNUST",
  "ATU",
] as const;
