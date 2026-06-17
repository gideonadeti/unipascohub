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
      { label: "Feedback", href: "/feedback" },
      { label: "Report an issue", href: "/feedback" },
      { label: "Testimonials", href: "/feedback" },
    ],
  },
];

export const heroSearchExamples = [
  "DCIT 101",
  "Level 200",
  "2024/2025",
  "End of sem",
  "Mid sem",
] as const;
