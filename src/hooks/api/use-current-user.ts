"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/api/query-keys";
import { currentUserOptions, updateCurrentUserProfile } from "@/lib/api/users";

export function useCurrentUser() {
  const { isSignedIn } = useAuth();

  return useQuery({
    ...currentUserOptions(),
    enabled: isSignedIn === true,
  });
}

export function useUpdateCurrentUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}
