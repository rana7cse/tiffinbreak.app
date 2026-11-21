// Minimal service worker. It exists only so browsers treat the app as
// installable. Offline support is out of scope: nothing is cached, and the
// fetch handler never calls respondWith, so the network handles every request.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", () => {});
