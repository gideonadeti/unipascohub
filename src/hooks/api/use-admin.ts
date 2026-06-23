"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type AdminUsersListFilters,
  adminDashboardStatsOptions,
  adminUsersListOptions,
  listStorageCleanupFailures,
  listStorageCleanupRuns,
  type OrphanCleanupPayload,
  promoteToModerator,
  storageCleanupFailuresOptions,
  storageCleanupRunsOptions,
  triggerOrphanCleanup,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/api/query-keys";

export function useAdminDashboardStats() {
  return useQuery(adminDashboardStatsOptions());
}

export function useAdminUsersList(filters: AdminUsersListFilters = {}) {
  return useQuery(adminUsersListOptions(filters));
}

export function usePromoteToModerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => promoteToModerator(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users.all });
      toast.success("User promoted to moderator");
    },
    onError: () => {
      toast.error("Could not promote user");
    },
  });
}

export function useStorageCleanupRuns(limit = 20) {
  return useQuery(storageCleanupRunsOptions(limit));
}

export function useStorageCleanupFailures(resolved = false) {
  return useQuery(storageCleanupFailuresOptions(resolved));
}

export function useTriggerOrphanCleanup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OrphanCleanupPayload) =>
      triggerOrphanCleanup(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.storage.runs(20),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.storage.failures(false),
      });
      if (data.dryRun) {
        toast.success(`Dry run complete: ${data.orphanCount} orphan(s) found`);
      } else {
        toast.success(
          `Cleanup complete: ${data.deleted.length} deleted, ${data.deleteFailures.length} failures`,
        );
      }
    },
    onError: () => {
      toast.error("Orphan cleanup failed");
    },
  });
}

export { listStorageCleanupRuns, listStorageCleanupFailures };
