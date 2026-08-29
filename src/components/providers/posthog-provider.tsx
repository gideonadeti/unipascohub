"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { useCurrentUser } from "@/hooks/api/use-current-user";
import {
  identifyAnalyticsUser,
  initPostHog,
  resetAnalyticsUser,
} from "@/lib/analytics/posthog";

export function PostHogProvider() {
  const { isSignedIn } = useAuth();
  const currentUser = useCurrentUser();
  const identifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      const user = currentUser.data?.user;

      if (user && identifiedUserIdRef.current !== user.id) {
        identifiedUserIdRef.current = user.id;
        identifyAnalyticsUser(user.id, user.role);
      }
    } else if (isSignedIn === false && identifiedUserIdRef.current !== null) {
      identifiedUserIdRef.current = null;
      resetAnalyticsUser();
    }
  }, [isSignedIn, currentUser.data]);

  return null;
}
