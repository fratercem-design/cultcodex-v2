// CultCodex Service Worker
// Strategy:
//   - Static assets (_next/static/*, fonts, favicons): cache-first, 1-year TTL
//   - Images (thumbnails, avatars): stale-while-revalidate, 7-day TTL
//   - HTML pages: network-first with cache fallback (keeps content fresh)
//   - API routes: network-only (never cache)
//
// Version bump this string whenever the cached asset list changes so
// the old cache is purged on activation.
const CACHE_VERSION = "v3";
const STATIC_CACHE = `cultcodex-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `cultcodex-images-${CACHE_VERSION}`;
const PAGE_CACHE = `cultcodex-pages-${CACHE_VERSION}`;

// Shell assets to pre-cache on install (adjust if paths change).
const PRECACHE_URLS = ["/", "/favicon.jpg", "/logo.jpg"];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // activate immediately
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                k !== STATIC_CACHE && k !== IMAGE_CACHE && k !== PAGE_CACHE
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim()) // take control of existing tabs
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API routes — always network-only; never cache.
  if (url.pathname.startsWith("/api/")) return;

  // Next.js built assets + fonts — cache-first, immutable.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff")
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images (YouTube thumbnails, avatars) — stale-while-revalidate.
  if (
    url.pathname.startsWith("/_next/image") ||
    /\.(jpg|jpeg|png|webp|avif|gif|svg|ico)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, 7 * 86400));
    return;
  }

  // HTML pages — network-first, fall back to cache.
  event.respondWith(networkFirst(request, PAGE_CACHE));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/** Cache-first: return cached response if present, otherwise fetch and cache. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const network = await fetch(request);
  if (network.ok) cache.put(request, network.clone());
  return network;
}

/**
 * Stale-while-revalidate: return cached response immediately while fetching
 * a fresh copy in the background.  Respects a maxAge (seconds) to force
 * revalidation once the cached entry is too old.
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchAndStore = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  });

  if (cached) {
    // Check age; revalidate in background regardless, but only serve stale
    // if it's within maxAge.
    const dateHeader = cached.headers.get("date");
    const age = dateHeader
      ? (Date.now() - new Date(dateHeader).getTime()) / 1000
      : 0;
    if (age < maxAge) {
      event.waitUntil(fetchAndStore); // update in background
      return cached;
    }
  }

  return fetchAndStore;
}

/**
 * Network-first: try network, fall back to cache on failure (offline / flaky
 * connection).  Caches successful responses for later use.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const network = await fetch(request);
    if (network.ok) cache.put(request, network.clone());
    return network;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Return a minimal offline response so the browser doesn't show a blank
    // error page.
    return new Response("You appear to be offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "The stream is live!",
    icon: data.icon || "/logo.jpg",
    badge: data.badge || "/favicon.jpg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/live" },
    actions: [{ action: "watch", title: "Watch Now" }],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Cult of Psyche is LIVE!",
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/live";
  event.waitUntil(clients.openWindow(url));
});
