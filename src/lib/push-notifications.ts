import webpush from "web-push";

import { prisma } from "@/lib/db";

function ensureVapidDetails(): void {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(
    "mailto:gideonadeti0@gmail.com",
    publicKey,
    privateKey,
  );
}

export async function saveSubscription(
  userId: string,
  sub: webpush.PushSubscription,
): Promise<void> {
  const { endpoint, keys } = sub;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { auth: keys.auth, p256dh: keys.p256dh, userId },
    create: {
      userId,
      endpoint,
      auth: keys.auth,
      p256dh: keys.p256dh,
    },
  });
}

export async function removeSubscription(
  userId: string,
  endpoint: string,
): Promise<void> {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

export async function removeAllUserSubscriptions(
  userId: string,
): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { userId } });
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
): Promise<void> {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const payload = JSON.stringify({
    title,
    body,
    icon: "/android-chrome-192x192.png",
  });

  ensureVapidDetails();

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { auth: sub.auth, p256dh: sub.p256dh },
        },
        payload,
      ),
    ),
  );

  const staleEndpoints: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        staleEndpoints.push(subs[i].endpoint);
      }
    }
  });

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }
}
