import { prisma } from "@/lib/db";
import { sendPushNotification } from "@/lib/push-notifications";
import { UserRole } from "../../generated/prisma/enums";

export const NotificationType = {
  PASCO_PENDING_REVIEW: "PASCO_PENDING_REVIEW",
  PASCO_REJECTED: "PASCO_REJECTED",
  PASCO_APPROVED: "PASCO_APPROVED",
  CATALOG_SUBMISSION_PENDING: "CATALOG_SUBMISSION_PENDING",
  CATALOG_SUBMISSION_APPROVED: "CATALOG_SUBMISSION_APPROVED",
  CATALOG_SUBMISSION_REJECTED: "CATALOG_SUBMISSION_REJECTED",
  CATALOG_COURSE_AUTO_APPROVED: "CATALOG_COURSE_AUTO_APPROVED",
} as const;

type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export async function createModeratorQueueNotifications(
  pascoId: string,
  title: string,
): Promise<void> {
  const moderators = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.MODERATOR, UserRole.ADMIN],
      },
    },
    select: { id: true },
  });

  if (moderators.length === 0) {
    return;
  }

  const link = `/moderation/pascos`;

  await prisma.notification.createMany({
    data: moderators.map((moderator) => ({
      userId: moderator.id,
      type: NotificationType.PASCO_PENDING_REVIEW,
      title: "Pasco pending review",
      body: `"${title}" needs moderation review.`,
      link: `${link}?highlight=${pascoId}`,
    })),
  });

  await Promise.all(
    moderators.map((mod) =>
      sendPushNotification(
        mod.id,
        "Pasco pending review",
        `"${title}" needs moderation review.`,
      ),
    ),
  );
}

export async function createUploaderRejectedNotification(
  uploaderId: string,
  pascoId: string,
  title: string,
  reason: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: uploaderId,
      type: NotificationType.PASCO_REJECTED,
      title: "Pasco rejected",
      body: `"${title}" was rejected: ${reason}`,
      link: `/pascos/${pascoId}`,
    },
  });

  await sendPushNotification(
    uploaderId,
    "Pasco rejected",
    `"${title}" was rejected: ${reason}`,
  );
}

export async function createUploaderApprovedNotification(
  uploaderId: string,
  pascoId: string,
  title: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: uploaderId,
      type: NotificationType.PASCO_APPROVED,
      title: "Pasco approved",
      body: `"${title}" has been approved and is now live.`,
      link: `/pascos/${pascoId}`,
    },
  });

  await sendPushNotification(
    uploaderId,
    "Pasco approved",
    `"${title}" has been approved and is now live.`,
  );
}

export async function createCatalogSubmissionPendingNotifications(
  summary: string,
): Promise<void> {
  const moderators = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.MODERATOR, UserRole.ADMIN],
      },
    },
    select: { id: true },
  });

  if (moderators.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: moderators.map((moderator) => ({
      userId: moderator.id,
      type: NotificationType.CATALOG_SUBMISSION_PENDING,
      title: "Catalog submission pending",
      body: `"${summary}" needs catalog review.`,
      link: "/moderation/catalog",
    })),
  });

  await Promise.all(
    moderators.map((mod) =>
      sendPushNotification(
        mod.id,
        "Catalog submission pending",
        `"${summary}" needs catalog review.`,
      ),
    ),
  );
}

export async function createCatalogSubmissionApprovedNotification(
  submitterId: string,
  summary: string,
  link: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: submitterId,
      type: NotificationType.CATALOG_SUBMISSION_APPROVED,
      title: "Catalog request approved",
      body: `"${summary}" was added to the catalog. You can continue uploading.`,
      link,
    },
  });

  await sendPushNotification(
    submitterId,
    "Catalog request approved",
    `"${summary}" was added to the catalog. You can continue uploading.`,
  );
}

export async function createCatalogSubmissionRejectedNotification(
  submitterId: string,
  summary: string,
  reason: string,
): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: submitterId,
      type: NotificationType.CATALOG_SUBMISSION_REJECTED,
      title: "Catalog request rejected",
      body: `"${summary}" was rejected: ${reason}`,
      link: "/contributions?tab=catalog",
    },
  });

  await sendPushNotification(
    submitterId,
    "Catalog request rejected",
    `"${summary}" was rejected: ${reason}`,
  );
}

export async function createCatalogCourseAutoApprovedNotification(
  summary: string,
): Promise<void> {
  const moderators = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.MODERATOR, UserRole.ADMIN],
      },
    },
    select: { id: true },
  });

  if (moderators.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: moderators.map((moderator) => ({
      userId: moderator.id,
      type: NotificationType.CATALOG_COURSE_AUTO_APPROVED,
      title: "Course added to catalog",
      body: `"${summary}" was added by a contributor. Review if needed.`,
      link: "/moderation/catalog",
    })),
  });

  await Promise.all(
    moderators.map((mod) =>
      sendPushNotification(
        mod.id,
        "Course added to catalog",
        `"${summary}" was added by a contributor. Review if needed.`,
      ),
    ),
  );
}

export type NotificationListQuery = {
  userId: string;
  unreadOnly?: boolean;
  limit: number;
  offset?: number;
};

export async function listNotifications(query: NotificationListQuery) {
  const where = {
    userId: query.userId,
    ...(query.unreadOnly ? { readAt: null } : {}),
  };

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      skip: query.offset ?? 0,
    }),
    prisma.notification.count({
      where: {
        userId: query.userId,
        readAt: null,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, unreadCount, totalCount };
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return result.count > 0;
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });

  return result.count > 0;
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return result.count;
}

export async function deleteAllNotifications(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { userId },
  });

  return result.count;
}

export async function deleteSelectedNotifications(
  userId: string,
  ids: string[],
): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { userId, id: { in: ids } },
  });

  return result.count;
}

export function serializeNotification(notification: {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    type: notification.type as NotificationTypeValue,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}
