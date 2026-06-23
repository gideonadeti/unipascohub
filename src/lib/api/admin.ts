import { queryOptions } from "@tanstack/react-query";
import type {
  StorageCleanupFailuresResponse,
  StorageCleanupRunsResponse,
} from "@/types/api/storage-cleanup";
import type { ProfileUser } from "@/types/api/users";

import { apiClient } from "./client";
import { queryKeys } from "./query-keys";

export type AdminUsersListFilters = {
  role?: string;
  page?: number;
  limit?: number;
};

export type AdminUsersListResponse = {
  users: ProfileUser[];
  total: number;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalPascos: number;
  publishedPascos: number;
  pendingModeration: number;
  totalCleanupRuns: number;
  unresolvedFailures: number;
};

export function getAdminDashboardStats() {
  return apiClient
    .get<AdminDashboardStats>("/api/admin/stats")
    .then((response) => response.data);
}

export function adminDashboardStatsOptions() {
  return queryOptions({
    queryKey: queryKeys.admin.stats(),
    queryFn: getAdminDashboardStats,
  });
}

export function listAdminUsers(filters: AdminUsersListFilters = {}) {
  return apiClient
    .get<AdminUsersListResponse>("/api/admin/users", { params: filters })
    .then((response) => response.data);
}

export function adminUsersListOptions(filters: AdminUsersListFilters = {}) {
  return queryOptions({
    queryKey: queryKeys.admin.users.list(filters),
    queryFn: () => listAdminUsers(filters),
  });
}

export function promoteToModerator(userId: string) {
  return apiClient
    .post<{ user: { id: string; role: string } }>(
      `/api/users/${userId}/promote-to-moderator`,
    )
    .then((response) => response.data);
}

export type OrphanCleanupPayload = {
  dryRun?: boolean;
  courseId?: string;
};

export type OrphanCleanupResponse = {
  dryRun: boolean;
  courseId: string | null;
  scanned: number;
  orphanCount: number;
  orphans: Array<{
    publicId: string;
    resourceType: string;
    bytes: number;
    createdAt: string;
  }>;
  deleted: string[];
  deleteFailures: string[];
};

export function triggerOrphanCleanup(payload: OrphanCleanupPayload = {}) {
  return apiClient
    .post<OrphanCleanupResponse>(
      "/api/admin/cloudinary/cleanup-orphans",
      payload,
    )
    .then((response) => response.data);
}

export function listStorageCleanupRuns(limit = 20) {
  return apiClient
    .get<StorageCleanupRunsResponse>("/api/admin/storage-cleanup/runs", {
      params: { limit },
    })
    .then((response) => response.data);
}

export function storageCleanupRunsOptions(limit = 20) {
  return queryOptions({
    queryKey: queryKeys.admin.storage.runs(limit),
    queryFn: () => listStorageCleanupRuns(limit),
  });
}

export function listStorageCleanupFailures(resolved = false) {
  return apiClient
    .get<StorageCleanupFailuresResponse>(
      "/api/admin/storage-cleanup/failures",
      { params: { resolved } },
    )
    .then((response) => response.data);
}

export function storageCleanupFailuresOptions(resolved = false) {
  return queryOptions({
    queryKey: queryKeys.admin.storage.failures(resolved),
    queryFn: () => listStorageCleanupFailures(resolved),
  });
}
