import { verifyWebhook, type WebhookEvent } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

import { deleteUserByClerkId, upsertUserFromClerk } from "@/lib/user-sync";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let evt: WebhookEvent;

  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Webhook verification failed:", err);

    return new Response("Verification failed", { status: 400 });
  }

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const { id, first_name, last_name } = evt.data;

      await upsertUserFromClerk({
        clerkId: id,
        firstName: first_name,
        lastName: last_name,
      });
    }

    if (evt.type === "user.deleted" && evt.data.id) {
      await deleteUserByClerkId(evt.data.id);
    }
  } catch (err) {
    console.error("Webhook handler failed:", err);

    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
