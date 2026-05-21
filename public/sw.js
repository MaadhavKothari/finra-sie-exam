// Service Worker for FINRA Exam Practice PWA
// Strategy: cache-first for static assets, network-first for HTML pages

const CACHE_VERSION = 'finra-prep-v1';
const BASE = '/finra-sie-exam/';

// Install: open cache (no precache list — runtime caching only)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: route by request type
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Only handle same-origin requests
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // HTML pages: network-first so updates propagate quickly
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
  } else {
    // Static assets (CSS, JS, images, fonts): cache-first
    event.respondWith(cacheFirst(request));
  }
});

// Network-first: try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return a basic offline fallback for HTML
    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline</title></head>' +
      '<body style="font-family:system-ui;text-align:center;padding:4rem">' +
      '<h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Cache-first: try cache, fall back to network and cache the response
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}
