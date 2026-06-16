"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { currentUserOptions } from "@/lib/api/users";

export function useCurrentUser() {
  const { isSignedIn } = useAuth();

  return useQuery({
    ...currentUserOptions(),
    enabled: isSignedIn === true,
  });
}
