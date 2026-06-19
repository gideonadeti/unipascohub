import type {
  NotificationListResponse,
  NotificationReadAllResponse,
  NotificationReadResponse,
} from "@/types/api/notifications";
import { apiClient } from "./client";

export type NotificationListFilters = {
  unreadOnly?: boolean;
  limit?: number;
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
