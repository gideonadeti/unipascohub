# Analytics (PostHog)

Uni Pasco Hub uses **PostHog** (client-side only, via `posthog-js`) for behavioral
funnels and cohorts — e.g. search → view → download conversion. It does **not**
replace the existing first-party metrics: **PostgreSQL remains the authoritative
source** for view/download counts, search records, and every number displayed in
the UI (`SearchQuery`, `PascoDownload`, `viewCount`, etc.). Never display
PostHog-derived counts in the UI and never send server-side events.

## Architecture

- Typed wrapper: `src/lib/analytics/posthog.ts` — the only place that imports
  `posthog-js`. All event names/properties are declared there.
- Provider: `src/components/providers/posthog-provider.tsx` — mounted in
  `src/app/layout.tsx`; initializes PostHog, identifies signed-in users, resets
  on sign-out.
- Transport: analytics requests are reverse-proxied through `/ingest`
  (rewrites in `next.config.ts`) so ad blockers and CSP don't drop events
  (same pattern as `/sentry-tunnel`).
- Tracking calls live only in event handlers, mutation `onSuccess` callbacks,
  or effects — never in React render logic (React Compiler is enabled).

## Events (the complete, approved list)

| Event                          | Fired when                                   | Properties |
| ------------------------------ | -------------------------------------------- | ---------- |
| `pasco_searched`               | A browse-list search with `q` returns        | `result_count`, `matched_course` |
| `pasco_viewed`                 | A pasco detail page loads successfully       | `pasco_id`, `course_code?` |
| `pasco_downloaded`             | A file download or download-all succeeds     | `pasco_id`, `course_code?`, `download_all` |
| `pasco_filtered`               | Browse filters are applied                   | `filters` (filter **keys** only, never values) |
| `pasco_uploaded`               | Pasco creation succeeds                      | `file_count`, `course_code?` |
| `contributor_upgrade_completed`| Contributor upgrade succeeds                 | — |
| `push_enabled`                 | Push subscription is saved successfully      | — |

Do not add events without updating this doc. Explicitly **not** implemented:
autocapture, automatic pageviews (Vercel Analytics covers page traffic), PostHog
session replay (Sentry already has replay; replaying copyrighted PDF content is
a legal risk), feature flags, experiments, surveys, server-side tracking, and a
cookie-consent banner (tracked as a separate open item).

## Privacy rules

Never send to PostHog: search-query text, names, emails, school, IP addresses,
file names/contents, Cloudinary URLs, auth tokens, push subscription
endpoints/keys. Identification uses the opaque Clerk user id plus the user's
`role` as the only person property. Anonymous visitors stay anonymous
(`person_profiles: "identified_only"` — no person profile is created for them).
Disclosed in `src/content/legal/privacy.ts` (Cookies and analytics +
Third-party processors sections).

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project API key (`phc_...`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog region endpoint (`https://us.i.posthog.com` or `https://eu.i.posthog.com`) |
| `NEXT_PUBLIC_POSTHOG_ENABLED` | Optional; set to `false` to force-disable even when configured |

If the key/host are unset, PostHog is completely inert: nothing initializes,
nothing is captured, and the `/ingest` rewrites are not registered.

### Local development

Leave the variables unset (inert by default), or copy the values from
[`.env.example`](../.env.example) into `.env` and restart `pnpm dev`.

### Production (Vercel)

1. Create a PostHog project (choose US or EU cloud) and copy the project API
   key and host.
2. In Vercel → Project → Settings → Environment Variables, add
   `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (Production +
   Preview). `NEXT_PUBLIC_*` vars are inlined at build time, so **redeploy
   after changing them**.
3. Deploy. Verify `/ingest` requests appear in the browser network tab and
   events land in PostHog → Activity.
4. In PostHog project settings, consider disabling the toolbar and surveys
   (the SDK already requests no replay/surveys).

CI (lint → typecheck → build) is unaffected; no server runtime, database, or
middleware changes are involved.
