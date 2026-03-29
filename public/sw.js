const CACHE_NAME = "flight-tracker-v1";

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => {
              /* offline or missing during dev */
            })
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = { title: "RouteWings", body: "Flight update", url: "/" };
  try {
    if (event.data) {
      const j = event.data.json();
      if (j && typeof j === "object") {
        payload = { ...payload, ...j };
      }
    }
  } catch {
    /* plain text */
    try {
      const t = event.data?.text();
      if (t) payload = { ...payload, body: t };
    } catch {
      /* ignore */
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || "/";
  const full = new URL(path, self.location.origin).href;
  event.waitUntil(
    self.clients.openWindow
      ? self.clients.openWindow(full)
      : Promise.resolve()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          const offlineReq = new URL("/offline", self.location.origin);
          return caches
            .match(req)
            .then(
              (hit) =>
                hit ||
                caches.match(offlineReq.pathname) ||
                caches.match(offlineReq.href)
            );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        fetch(req)
          .then((res) => {
            if (res.ok) {
              caches.open(CACHE_NAME).then((c) => c.put(req, res.clone()));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          const offlineReq = new URL("/offline", self.location.origin);
          return (
            caches.match(offlineReq.pathname) || caches.match(offlineReq.href)
          );
        });
    })
  );
});
