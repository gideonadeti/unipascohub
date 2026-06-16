import { queryOptions } from "@tanstack/react-query";

import type { CurrentUserResponse } from "@/types/api/users";

import { apiFetch } from "./client";
import { queryKeys } from "./query-keys";

export function getCurrentUser() {
  return apiFetch<CurrentUserResponse>("/api/users/me");
}

export function currentUserOptions() {
  return queryOptions({
    queryKey: queryKeys.users.me,
    queryFn: getCurrentUser,
  });
}
