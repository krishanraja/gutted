const CACHE_NAME = 'gutted-v1'
const STATIC_ASSETS = [
  '/',
  '/icon.png',
  '/logo.png',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests and API calls
  if (request.method !== 'GET' || request.url.includes('/api/')) return

  event.respondWith(
    caches.match(request).then((cached) => {
      // Network-first for HTML pages, cache-first for static assets
      if (request.headers.get('accept')?.includes('text/html')) {
        return fetch(request)
          .then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            return response
          })
          .catch(() => cached || new Response('Offline', { status: 503 }))
      }

      // Cache-first for static assets
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && (request.url.includes('/icon') || request.url.includes('/logo') || request.url.includes('.css') || request.url.includes('.js'))) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
