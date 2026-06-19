export type NotificationType = "PASCO_PENDING_REVIEW" | "PASCO_REJECTED";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

export type NotificationReadResponse = {
  success: true;
};

export type NotificationReadAllResponse = {
  updatedCount: number;
};
