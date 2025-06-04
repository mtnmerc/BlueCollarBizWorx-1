const CACHE_NAME = 'bizworx-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch strategy - network first, then cache
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});