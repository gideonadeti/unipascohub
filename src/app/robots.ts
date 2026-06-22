import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/notifications/",
          "/moderation/",
          "/contributions/",
        ],
      },
    ],
    sitemap: "https://unipascohub.com/sitemap.xml",
  };
}
