const CACHE_NAME = 'signage-player-v1';
const MEDIA_CACHE = 'signage-media-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './player.js',
  './favicon.svg'
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

function rangeResponse(response, rangeHeader) {
  return response.blob().then((blob) => {
    const size = blob.size;
    const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    let start = 0;
    let end = size - 1;
    if (m && m[1] !== '') {
      start = parseInt(m[1], 10);
      if (m[2] !== '') end = Math.min(parseInt(m[2], 10), size - 1);
    } else if (m && m[2] !== '') {
      start = Math.max(0, size - parseInt(m[2], 10));
    }
    if (!m || start >= size || start > end) {
      return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    }
    return new Response(blob.slice(start, end + 1), {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': response.headers.get('Content-Type') || blob.type || 'application/octet-stream',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes'
      }
    });
  });
}

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

  // Player'ın kendi indirmesi (?precache=1): doğrudan ağa, cache.put'u player yapar
  if (url.searchParams.has('precache')) return;

  // For media files in /uploads/
  if (url.pathname.startsWith('/uploads/')) {
    const range = event.request.headers.get('range');
    event.respondWith(
      caches.match(event.request.url, { cacheName: MEDIA_CACHE }).then((cachedResponse) => {
        if (cachedResponse) {
          // Video Range isteği: cache'teki tam dosyadan 206 dilimi üret
          // (tam 200 dönmek ileri sarmada Chrome'u bozuyor -> siyah ekran)
          return range ? rangeResponse(cachedResponse, range) : cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          // 206 kısmi yanıt cache'lenemez; tam dosyayı player indirir
          if (networkResponse.status === 200) {
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
