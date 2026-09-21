const CACHE = "gameoflife-v6"; // bump on every deploy

const FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/game.js",
  "/p5.min.js",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => cached || (req.mode === "navigate" ? caches.match("/index.html") : undefined));

      // Serve cached immediately if we have it, otherwise wait on network
      return cached || networkFetch;
    })
  );
});