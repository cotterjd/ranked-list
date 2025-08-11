const CACHE_NAME = 'ranked-list-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching initial resources');
      return cache.addAll(urlsToCache);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Ensure the service worker takes control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network, cache new resources
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        console.log('Service Worker: Serving from cache:', event.request.url);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response to cache it
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Cache JS, CSS, and other assets
          if (event.request.url.includes('/assets/') || 
              event.request.url.endsWith('.js') || 
              event.request.url.endsWith('.css') ||
              event.request.url.endsWith('.png') ||
              event.request.url.endsWith('.ico')) {
            console.log('Service Worker: Caching new resource:', event.request.url);
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      });
    }).catch(() => {
      console.log('Service Worker: Network failed, serving cached index.html');
      // If both network and cache fail for navigation requests, serve index.html
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
