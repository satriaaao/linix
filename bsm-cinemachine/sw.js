const CACHE='bsm-display-shell-v20261008-2';
const DISPLAY='/display';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname === '/display' || url.pathname === '/display.html') {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          event.waitUntil(
            caches.open(CACHE).then(cache => cache.put(DISPLAY, res.clone()))
          );
          return res;
        })
        .catch(() => caches.match(DISPLAY))
    );
  }
});
