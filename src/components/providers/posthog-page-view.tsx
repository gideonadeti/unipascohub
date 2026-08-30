"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { capturePageView, initPostHog } from "@/lib/analytics/posthog";

export function PostHogPageView() {
  const pathname = usePathname();

  useEffect(() => {
    // initPostHog is idempotent and also covers the first-mount ordering
    // against the provider's init effect.
    initPostHog();

    capturePageView(pathname);
  }, [pathname]);

  return null;
}
