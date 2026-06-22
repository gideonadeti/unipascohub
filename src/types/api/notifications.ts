export type NotificationType =
  | "PASCO_PENDING_REVIEW"
  | "PASCO_REJECTED"
  | "PASCO_APPROVED"
  | "CATALOG_SUBMISSION_PENDING"
  | "CATALOG_SUBMISSION_APPROVED"
  | "CATALOG_SUBMISSION_REJECTED"
  | "CATALOG_COURSE_AUTO_APPROVED";

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
  totalCount: number;
};

export type NotificationReadResponse = {
  success: true;
};

export type NotificationReadAllResponse = {
  updatedCount: number;
};

export type NotificationDeleteResponse = {
  success: true;
};
