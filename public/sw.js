const CACHE_NAME = "uhn-v5";

const PRECACHE_URLS = ["/favicon.svg", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests — let external scripts
  // (analytics, APIs) and non-http schemes (chrome-extension://) pass through
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  const isNavigation = request.mode === "navigate" || request.destination === "document";
  const isAstroBuildAsset = url.pathname.startsWith("/_astro/");

  // Always use fresh HTML (no cache.put — cloning here races the navigation Response body).
  if (isNavigation) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Let immutable build assets come from network first to avoid mixed-version module graphs.
  if (isAstroBuildAsset) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Cache-first for other non-document same-origin resources.
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (!response.ok) return response;
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      } catch {
        // Ignore clone / quota failures — still return the live response.
      }
      return response;
    }),
  );
});
