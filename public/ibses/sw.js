// Offline cache so the app works without wifi after the first visit.
const CACHE = 'ibses-unit3-v1';
const SHELL = ['./', 'index.html', 'css/style.css', 'manifest.webmanifest', 'assets/mark.svg', 'assets/app-icon.svg', 'assets/apple-touch-icon.png',
  'js/app.js', 'js/util.js', 'js/data.js', 'js/cards.js', 'js/games.js', 'js/label.js', 'js/notes.js', 'js/labs.js', 'js/lab-skeleton.js', 'js/lab-planes.js', 'js/lab-joints.js',
  'js/lib/three.module.min.js', 'js/lib/OrbitControls.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request)));
});
