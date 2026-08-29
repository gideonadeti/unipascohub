export const privacySections = [
  {
    title: "Draft notice",
    body: "This privacy policy is a draft placeholder and will be updated before public launch. It is provided to explain the current system at a high level.",
  },
  {
    title: "What we collect",
    body: "We collect basic account details needed to operate the service (for example, authentication identifiers and profile information provided through Clerk). When you upload pascos, we store file metadata (like filename and size) and engagement counts (views, downloads, likes/dislikes).",
  },
  {
    title: "Cookies and analytics",
    body: "We use cookies required for authentication and session management. When you use search, we store your search query text on our servers (along with optional account identifier if signed in and basic result metadata) to understand usage and improve the product. We do not use third-party advertising trackers for search. We also use PostHog, a product analytics service, to understand how the product is used (for example, how often pascos are searched, viewed, or downloaded). PostHog receives a pseudonymous account identifier (if you are signed in) and product usage events only — we do not send it your name, email address, school, search query text, or file contents.",
  },
  {
    title: "Third-party processors",
    body: "We use third-party services to run Uni Pasco Hub. Clerk provides authentication, Cloudinary stores uploaded files, and PostHog provides product analytics. These services process data on our behalf to deliver and improve the product.",
  },
  {
    title: "How we use data",
    body: "We use data to provide account access, allow uploads and downloads, prevent abuse, and improve the product. We do not sell your personal information.",
  },
  {
    title: "Contact",
    body: "If you have questions or want to request changes or deletion of your data, please use the Feedback page to reach the maintainers.",
  },
] as const;
