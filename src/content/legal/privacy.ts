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
    body: "We use cookies required for authentication and session management. When you use search, we store your search query text on our servers (along with optional account identifier if signed in and basic result metadata) to understand usage and improve the product. We do not use third-party advertising trackers for search.",
  },
  {
    title: "Third-party processors",
    body: "We use third-party services to run Uni Pasco Hub. Clerk provides authentication, and Cloudinary stores uploaded files. These services process data on our behalf to deliver the product.",
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
