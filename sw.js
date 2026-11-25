// SOC-HQ service worker — installability only.
// No caching and no interception: every fetch goes straight to the network.
// Its only job is to satisfy the browser installability check (a registered
// worker with a fetch handler) so Edge enables "Apps > Install this site as
// an app". It never touches Vite hot-reload or the /api proxy.
self.addEventListener("fetch", () => {
  // Intentionally empty: no respondWith, so the request proceeds to the
  // network untouched.
});
