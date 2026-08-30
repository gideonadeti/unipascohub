import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/pascos/new",
          "/notifications/",
          "/moderation/",
          "/contributions/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
