const CACHE = "agentic-inbox-v1";
const ASSETS = ["/", "/manifest.json", "/favicon.svg"];

self.addEventListener("install", (e) => {
  (e as any).waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  (self as any).skipWaiting();
});

self.addEventListener("activate", (e) => {
  (e as any).waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  (self as any).clients.claim();
});

self.addEventListener("fetch", (e: any) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
