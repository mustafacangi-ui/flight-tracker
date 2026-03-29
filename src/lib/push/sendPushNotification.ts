import type { SupabaseClient } from "@supabase/supabase-js";

import { configureWebPush, isWebPushConfigured, webpush } from "../serverWebPush";

export type PushMessagePayload = {
  title: string;
  body: string;
  /** Deep link path, e.g. /flight/TK1234 */
  url?: string;
};

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function isGoneStatus(err: unknown): boolean {
  const e = err as { statusCode?: number };
  return e?.statusCode === 404 || e?.statusCode === 410;
}

/**
 * Loads the user's push subscriptions, sends the payload to each endpoint,
 * and deletes rows that returned 404 / 410 (expired or invalid).
 */
export async function sendPushNotification(
  supabase: SupabaseClient,
  userId: string,
  message: PushMessagePayload
): Promise<{ sent: number; removed: number }> {
  if (!isWebPushConfigured() || !configureWebPush()) {
    console.error(
      "[push-worker] VAPID not configured — skipping send for user",
      userId
    );
    return { sent: 0, removed: 0 };
  }

  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const list = (rows ?? []) as SubscriptionRow[];
  if (list.length === 0) {
    return { sent: 0, removed: 0 };
  }

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url ?? "/",
  });

  let sent = 0;
  let removed = 0;

  for (const row of list) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        payload,
        { TTL: 3600 }
      );
      sent += 1;
    } catch (err) {
      if (isGoneStatus(err)) {
        const { error: delErr } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", row.id);
        if (!delErr) {
          removed += 1;
          console.log("[push-worker] invalid subscription removed");
        }
      } else {
        console.error("[push-worker] send failed for subscription", row.id, err);
      }
    }
  }

  return { sent, removed };
}
