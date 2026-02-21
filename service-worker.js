// STPL Complaint Management System - Service Worker
const CACHE_NAME = 'stpl-cms-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/Administration.html',
  '/signup-approvals.html',
  '/hostel.html',
  '/inventory.html',
  '/new-complaint.html',
  '/Submitted-complaints.html',
  '/hostel_export.html',
  '/inventory_export.html',
  '/hse.html',
  '/manifest.json',
  '/logo.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.log('[Service Worker] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version or fetch from network
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-GET requests or non-successful responses
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }
            // Clone response and cache it
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Return offline fallback if available
            console.log('[Service Worker] Fetch failed, serving offline content');
          });
      })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    console.log('[Service Worker] Background sync triggered');
    event.waitUntil(syncFormData());
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data || {}
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/dashboard.html')
  );
});

// Helper function to sync form data
async function syncFormData() {
  // This would sync any queued form submissions when back online
  console.log('[Service Worker] Syncing form data...');
}
