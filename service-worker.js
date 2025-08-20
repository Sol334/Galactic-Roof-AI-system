// Service Worker for Galactic Roof AI
const CACHE_NAME = 'galactic-roof-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/auth.js',
  '/js/bridge.js',
  '/offline.html',
  '/images/logo.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests (handle differently)
  if (event.request.url.includes('/api/')) {
    return handleApiRequest(event);
  }

  // For page navigations, use network-first strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If fetch fails, return offline fallback for images
            if (event.request.destination === 'image') {
              return caches.match('/images/offline-image.png');
            }
          });
      })
  );
});

// Handle API requests with network-first strategy and offline data sync
function handleApiRequest(event) {
  event.respondWith(
    fetch(event.request.clone())
      .catch(() => {
        // If offline, check if we have cached response
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If it's a POST/PUT/DELETE request, store it for later sync
            if (event.request.method !== 'GET') {
              // Store the request in IndexedDB for later sync
              return storeRequestForSync(event.request.clone())
                .then(() => {
                  return new Response(JSON.stringify({
                    offline: true,
                    message: 'This request has been stored and will be sent when you are online.'
                  }), {
                    headers: { 'Content-Type': 'application/json' }
                  });
                });
            }

            // Return offline data placeholder
            return new Response(JSON.stringify({
              offline: true,
              message: 'You are offline. Please check your connection.'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
      })
  );
}

// Store request for later sync
async function storeRequestForSync(request) {
  // This would be implemented with IndexedDB
  // For simplicity, we're just logging it here
  console.log('Storing request for later sync:', request.url);
  
  // In a real implementation, you would:
  // 1. Open IndexedDB
  // 2. Store the request URL, method, headers, and body
  // 3. Register a sync event with the sync manager
  
  return Promise.resolve();
}

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Sync pending requests
async function syncPendingRequests() {
  // This would retrieve pending requests from IndexedDB and send them
  console.log('Syncing pending requests');
  
  // In a real implementation, you would:
  // 1. Open IndexedDB
  // 2. Get all stored requests
  // 3. Send each request
  // 4. Remove successful requests from the store
  
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/badge-72x72.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});