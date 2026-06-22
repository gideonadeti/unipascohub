import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  deleteAllNotifications as deleteAllNotificationsApi,
  deleteNotification as deleteNotificationApi,
  deleteSelectedNotifications as deleteSelectedNotificationsApi,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListFilters,
} from "@/lib/api/notifications";
import { queryKeys } from "@/lib/api/query-keys";

export function notificationsListOptions(
  filters: NotificationListFilters = {},
) {
  return queryOptions({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => listNotifications(filters),
    refetchInterval: 60_000,
  });
}

export function useNotificationsList(
  filters: NotificationListFilters = { limit: 20 },
) {
  return useQuery(notificationsListOptions(filters));
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllNotificationsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteSelectedNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSelectedNotificationsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
