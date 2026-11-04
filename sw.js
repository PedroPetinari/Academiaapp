const V = 'appgym-v4';
const FILES = ['./', 'index.html', 'style.css', 'config.js', 'manifest.json', 'icon-192.png', 'icon-512.png'].concat(['js/util.js', 'js/state.js', 'js/workout.js', 'js/storage.js', 'js/art.js', 'js/emblems.js', 'js/themes.js', 'js/sync.js', 'js/extras.js', 'js/views.js', 'js/events.js', 'js/main.js']);
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rede primeiro (sempre a versão mais nova); o cache só serve quando está sem internet.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) caches.open(V).then(c => c.put(e.request, r.clone())); return r; }).catch(() => caches.match(e.request)));
});