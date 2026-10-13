// NAYORA — service worker (v4).
// Bump CACHE_NAME on every shell/auth fix so activate() drops stale caches.
const CACHE_NAME = "nayora-shell-v4";
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/favicon.png",
  "/nayora-mark.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// Hashed /assets/* — cache after first successful network fetch.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

// HTML / navigations — always prefer network so deploys are visible immediately.
async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API / auth / server functions
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_server") ||
    url.pathname.startsWith("/_serverFn")
  ) {
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (request.mode === "navigate" || url.pathname === "/") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
