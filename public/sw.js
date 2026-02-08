const CACHE_NAME = "uhn-v3";

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

  // Always prefer fresh HTML so we don't serve pages that reference old hashed /_astro assets.
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Let immutable build assets come from network first to avoid mixed-version module graphs.
  if (isAstroBuildAsset) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // Cache-first for other non-document same-origin resources.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
    }),
  );
});
