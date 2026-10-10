const CACHE = 'garden-of-rain-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache the app shell. Do NOT auto-activate — wait for the user
// to confirm the update so an in-progress edit is never force-refreshed.
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
});

// Activate: drop ONLY our own outdated caches (prefix garden-of-rain-).
// Never touch other same-origin apps' caches.
const CACHE_PREFIX = 'garden-of-rain-';
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// The page asks us to take over only after the user clicks "update".
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: cache-first for same-origin GET; fall back to the app shell offline.
// External links (news / academic) are left untouched so the browser can
// report the real failure instead of serving stale content as "live".
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const cp = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, cp));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
