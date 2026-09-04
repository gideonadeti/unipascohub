import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "api.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
    ],
  },
  async rewrites() {
    // PostHog reverse proxy: keeps analytics requests same-origin so ad
    // blockers and future CSP enforcement don't drop events. Inert when
    // NEXT_PUBLIC_POSTHOG_HOST is unset. See docs/analytics.md.
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogHost) {
      return [];
    }

    const posthogStaticHost = posthogHost.includes("eu.i.posthog.com")
      ? "https://eu-assets.i.posthog.com"
      : "https://us-assets.i.posthog.com";

    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogStaticHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              // Clerk custom FAPI domain + Turnstile + protection hosts per
              // https://clerk.com/docs/guides/secure/best-practices/csp-headers
              // (the trailing ":*" on protect hosts is required — they are
              // served on non-443 ports).
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://clerk.com https://clerk.unipascohub.weamp.org https://challenges.cloudflare.com https://*.protect.clerk.com https://upload-widget.cloudinary.com https://*.ingest.sentry.io https://va.vercel-scripts.com https://vercel.live https://*.posthog.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://avatars.githubusercontent.com https://github.com https://*.posthog.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.cloudinary.com https://*.clerk.com https://clerk.com https://clerk.unipascohub.weamp.org https://*.protect.clerk.com:* https://*.ingest.sentry.io https://va.vercel-scripts.com https://vercel.live https://*.posthog.com",
              "frame-src 'self' https://*.clerk.com https://clerk.com https://clerk.unipascohub.weamp.org https://challenges.cloudflare.com https://*.protect.clerk.com",
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const config =
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
    ? withSentryConfig(nextConfig, {
        org: process.env.SENTRY_ORG ?? "",
        project: process.env.SENTRY_PROJECT ?? "",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        tunnelRoute: "/sentry-tunnel",
        silent: !process.env.CI,
      })
    : nextConfig;

export default config;
