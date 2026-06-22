"use server";

import webpush from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";

webpush.setVapidDetails(
  "mailto:gideonadeti0@gmail.com",
  vapidPublicKey,
  vapidPrivateKey,
);

let subscription: webpush.PushSubscription | null = null;

export async function subscribeUser(sub: webpush.PushSubscription) {
  subscription = sub;
  return { success: true };
}

export async function unsubscribeUser() {
  subscription = null;
  return { success: true };
}

export async function sendNotification(message: string) {
  if (!subscription) {
    return { success: false, error: "No subscription available" };
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: "Uni Pasco Hub",
        body: message,
        icon: "/android-chrome-192x192.png",
      }),
    );
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send notification" };
  }
}
