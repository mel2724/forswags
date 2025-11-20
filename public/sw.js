const CACHE_NAME = 'forswags-v12';
const RUNTIME_CACHE = 'forswags-runtime-v12';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/logo-icon.png',
  '/images/logo-full.jpeg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first for everything to avoid caching issues
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // NEVER cache JavaScript files - always fetch fresh
  if (url.pathname.endsWith('.js') || url.pathname.includes('/deps/') || url.pathname.includes('/src/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
    );
    return;
  }

  // API requests - network only
  if (url.pathname.includes('/api/') || url.pathname.includes('supabase')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets only (images, fonts, etc.) - cache
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|woff|woff2|ttf|eot|ico)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else - network first
  event.respondWith(fetch(request));
});

// Message event for cache updates
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
