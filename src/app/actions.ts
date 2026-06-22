"use server";

import { auth } from "@clerk/nextjs/server";
import type webpush from "web-push";

import {
  removeAllUserSubscriptions,
  removeSubscription,
  saveSubscription,
} from "@/lib/push-notifications";

export async function subscribeUser(sub: webpush.PushSubscription) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  await saveSubscription(userId, sub);
  return { success: true };
}

export async function unsubscribeUser(endpoint?: string) {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Unauthorized" };
  }

  if (endpoint) {
    await removeSubscription(userId, endpoint);
  } else {
    await removeAllUserSubscriptions(userId);
  }

  return { success: true };
}
