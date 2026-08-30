"use client";

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const POSTHOG_ENABLED = process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "false";

// PostgreSQL remains the authoritative source for views, downloads, searches,
// and displayed metrics. PostHog is only for client-side behavioral funnels and
// cohorts. Never send search-query text, names, emails, school, IPs, file
// names/content, Cloudinary URLs, tokens, or push credentials here.
let initialized = false;

export function isPostHogEnabled(): boolean {
  return POSTHOG_ENABLED && Boolean(POSTHOG_KEY) && Boolean(POSTHOG_HOST);
}

export function initPostHog(): void {
  if (initialized || !POSTHOG_ENABLED || !POSTHOG_KEY || !POSTHOG_HOST) {
    return;
  }

  initialized = true;

  posthog.init(POSTHOG_KEY, {
    // Same-origin reverse proxy (see next.config.ts) to survive ad blockers.
    api_host: "/ingest",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    person_profiles: "identified_only",
  });
}

export function identifyAnalyticsUser(userId: string, role: string): void {
  if (!initialized) {
    return;
  }

  posthog.identify(userId, { role });
}

export function resetAnalyticsUser(): void {
  if (!initialized) {
    return;
  }

  posthog.reset();
}

type AnalyticsEvents = {
  contributor_upgrade_completed: Record<string, never>;
  pasco_downloaded: {
    pasco_id: string;
    course_code?: string;
    download_all: boolean;
  };
  pasco_filtered: { filters: string[] };
  pasco_searched: { result_count: number; matched_course: boolean };
  pasco_uploaded: { course_code?: string; file_count: number };
  pasco_viewed: { course_code?: string; pasco_id: string };
  push_enabled: Record<string, never>;
};

export type AnalyticsEventName = keyof AnalyticsEvents;

export function trackAnalyticsEvent<K extends AnalyticsEventName>(
  name: K,
  properties?: AnalyticsEvents[K],
): void {
  if (!initialized) {
    return;
  }

  posthog.capture(name, properties);
}
