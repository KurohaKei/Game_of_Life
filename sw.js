const CACHE = "gameoflife-v1";

const FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/game.js",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png"
];

// Install: download and store every file above.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES))
  );
  self.skipWaiting();   // don't wait for every tab to close before updating
});

// Activate: throw away caches from older versions.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: serve from the cache first, fall back to the network.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Navigations (opening the app) always resolve to the cached shell offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req))
  );
});