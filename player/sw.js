const CACHE_NAME = 'signage-player-v2';
const MEDIA_CACHE = 'signage-media-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './resolver.js',
  './player.js',
  './favicon.svg',
  '/__/firebase/init.json'
];

// Medya Firebase Storage'dan gelir; download URL'leri token içerdiği için kalıcı önbellek anahtarı olarak uygundur
function isMediaUrl(url) {
  return url.hostname === 'firebasestorage.googleapis.com' || url.pathname.startsWith('/uploads/');
}

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
        if (!url || !url.startsWith('http')) return;
        cache.match(url).then((hit) => {
          if (hit) return;
          fetch(url, { mode: 'cors' })
            .then((response) => {
              if (response.ok) {
                cache.put(url, response);
              }
            })
            .catch(() => {
              // Ignore precache failure for individual item; will retry on next manifest
            });
        });
      });
    });
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Media: cache-first, otherwise network passthrough (cached via PRECACHE_MEDIA as CORS response)
  if (isMediaUrl(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE)
        .then((cache) => cache.match(event.request.url))
        .then((cachedResponse) => cachedResponse || fetch(event.request))
    );
    return;
  }

  // Realtime Database stream/REST and other cross-origin calls are never cached
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/player') && url.pathname !== '/__/firebase/init.json') return;

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
