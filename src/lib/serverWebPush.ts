import webpush from "web-push";

let configured = false;

export function isWebPushConfigured(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const sub = process.env.VAPID_SUBJECT?.trim();
  return Boolean(pub && priv && sub);
}

export function configureWebPush(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const sub = process.env.VAPID_SUBJECT?.trim();
  if (!pub || !priv || !sub) return false;
  webpush.setVapidDetails(sub, pub, priv);
  configured = true;
  return true;
}

export { webpush };
