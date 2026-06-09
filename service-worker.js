/* Baobab Code — Service Worker
   Caches all core assets for offline use */

const CACHE = 'baobab-code-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/nav.css',
  '/css/home.css',
  '/css/files.css',
  '/css/editor.css',
  '/css/terminal.css',
  '/css/settings.css',
  '/js/app.js',
  '/js/editor.js',
  '/js/files.js',
  '/js/terminal.js',
  '/js/settings.js',
  '/screens/home.html',
  '/screens/files.html',
  '/screens/editor.html',
  '/screens/terminal.html',
  '/screens/settings.html',
  '/assets/icons/logo.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
