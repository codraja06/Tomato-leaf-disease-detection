const CACHE_NAME = 'tomatoguard-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn-icons-png.flaticon.com/512/3062/3062634.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('👷 Service Worker: Caching offline shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== 'tomatoguard-diagnostic-cache') {
            console.log('👷 Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // We only intercept GET requests for static assets, models and UI pages
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip chrome-extension or external APIs except necessary assets
  if (!url.origin.startsWith(self.location.origin) && !url.href.includes('unsplash') && !url.href.includes('flaticon')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset, fetch fresh in background for next time
        fetch(event.request).then((freshResponse) => {
          if (freshResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, freshResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache newly fetched assets dynamically (e.g., model.json)
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If query fails (offline mode/no connection) and requested model file is not found:
        console.warn('👷 Service Worker: Network request failed for', event.request.url);
      });
    })
  );
});
