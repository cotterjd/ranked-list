const CACHE_NAME = 'ranked-list-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index-ffaeb7b9.css',
  '/assets/index-6e224326.js',
  '/assets/vue-5532db34.svg',
  '/vite.svg',
  // '/offline.html',
  // Add more URLs to cache here
];

self.addEventListener('install', (event) => {
  self.registration.scope = 'https://list.cotterslist.com';
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request to make a network request
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response to store it in the cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // If both the network and the cache fail, show an offline fallback
      return caches.match('/index.html'); // TODO: make offline file? 
    })
  );
});
