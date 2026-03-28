const CACHE_NAME = "cukrarna-signage-v1";

// Cache display pages and API responses
const CACHEABLE_PATTERNS = [
  /\/display\//,
  /\/api\/displays\/.*\/content/,
  /\/api\/uploads\//,
  /\/_next\//,
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Don't cache SSE, admin, or non-GET requests
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/api/events") ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }

  const shouldCache = CACHEABLE_PATTERNS.some((pattern) =>
    pattern.test(url.pathname)
  );

  if (!shouldCache) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache the response
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        const cached = await caches.match(event.request);
        if (cached) return cached;
        // Return a basic offline response
        return new Response("Offline", { status: 503 });
      })
  );
});
