import type {
  NotificationDeleteResponse,
  NotificationListResponse,
  NotificationReadAllResponse,
  NotificationReadResponse,
} from "@/types/api/notifications";
import { apiClient } from "./client";

export type NotificationListFilters = {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
};

export function listNotifications(filters: NotificationListFilters = {}) {
  return apiClient
    .get<NotificationListResponse>("/api/notifications", { params: filters })
    .then((response) => response.data);
}

export function markNotificationRead(notificationId: string) {
  return apiClient
    .patch<NotificationReadResponse>(
      `/api/notifications/${notificationId}/read`,
    )
    .then((response) => response.data);
}

export function markAllNotificationsRead() {
  return apiClient
    .patch<NotificationReadAllResponse>("/api/notifications/read-all")
    .then((response) => response.data);
}

export function deleteNotification(notificationId: string) {
  return apiClient
    .delete<NotificationDeleteResponse>(`/api/notifications/${notificationId}`)
    .then((response) => response.data);
}

export function deleteAllNotifications() {
  return apiClient
    .delete<{ deletedCount: number }>("/api/notifications")
    .then((response) => response.data);
}

export function deleteSelectedNotifications(ids: string[]) {
  return apiClient
    .delete<{ deletedCount: number }>("/api/notifications", { data: { ids } })
    .then((response) => response.data);
}
