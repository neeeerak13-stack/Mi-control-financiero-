const CACHE = "mcf-nilo-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./styles.css",
  "./finance-engine.js",
  "./icon-192.png",
  "./icon-512.png"
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      await self.skipWaiting();
    })()
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("mcf-") && name !== CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(event.request);
        if (fresh.ok) await cache.put(event.request, fresh.clone());
        return fresh;
      } catch (error) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") {
          return (await cache.match("./index.html")) || Response.error();
        }
        return Response.error();
      }
    })()
  );
});
