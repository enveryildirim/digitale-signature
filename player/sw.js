const CACHE_NAME = 'signage-player-v1';
const MEDIA_CACHE = 'signage-media-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './player.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== MEDIA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for messages from player client to pre-cache media assets
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'PRECACHE_MEDIA') {
    const urls = event.data.urls || [];
    caches.open(MEDIA_CACHE).then((cache) => {
      urls.forEach((url) => {
        // Only cache relative upload paths or local URLs
        if (url && (url.startsWith('/uploads') || url.startsWith('http'))) {
          fetch(url, { mode: 'cors' })
            .then((response) => {
              if (response.ok) {
                cache.put(url, response);
              }
            })
            .catch(() => {
              // Ignore precache failure for individual item; will retry during playback
            });
        }
      });
    });
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API endpoints, prefer network, but allow fallback for manifest
  if (url.pathname.startsWith('/api/player/manifest')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For media files in /uploads/
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.match(event.request, { cacheName: MEDIA_CACHE }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(MEDIA_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch((err) => {
          // If network failed and not cached
          return cachedResponse || Promise.reject(err);
        });
      })
    );
    return;
  }

  // Default stale-while-revalidate for static player files
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
