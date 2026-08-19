/* Handelsjournal — Service Worker
   Cacht die App-Hülle (HTML/Icons/Manifest) für Installierbarkeit und Offline-Start.
   TradingView-Chart und Chart.js benötigen weiterhin eine aktive Internetverbindung. */

const CACHE_NAME = "handelsjournal-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(SHELL_FILES); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  const url = new URL(req.url);

  // Nur eigene (same-origin) Anfragen aus dem Cache bedienen — CDN/TradingView immer live laden.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return resp;
      }).catch(function () {
        if (req.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
