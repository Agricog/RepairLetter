// RepairLetter Service Worker
// Minimal service worker for PWA installability and offline shell caching

const CACHE_NAME = 'repairletter-v1';

// App shell files to cache for offline access
const APP_SHELL = [
  '/',
  '/index.html',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first strategy (always try network, fall back to cache)
// API calls are never cached — only the app shell
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls, auth, or Stripe
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('clerk') ||
    url.hostname.includes('stripe') ||
    url.hostname.includes('sentry')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: serve from cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // For navigation requests, return the cached index.html (SPA)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
