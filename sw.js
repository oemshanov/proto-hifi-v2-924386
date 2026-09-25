/* Сервис-воркер: нужен, чтобы прототип ставился на экран «Домой» и открывался
   без сети. Версию CACHE менять при каждой выкатке — иначе у проверяющего
   останется старая сборка, и он найдёт уже исправленные баги. */

const CACHE = '4lapy-hifi-202609250811';
const SHELL = [
  './', 'index.html', 'styles.css', 'fonts.css', 'tokens.css', 'app.js', 'data.js', 'pets.js', 'treat.js', 'tab-icons.js',
  'manifest.webmanifest',
  'fonts/SuisseIntl-Regular.woff2', 'fonts/SuisseIntl-Book.woff2',
  'fonts/SuisseIntl-Medium.woff2', 'fonts/SuisseIntl-SemiBold.woff2',
  'fonts/SuisseIntl-Bold.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Сеть вперёд, кэш — запасной аэродром. Так проверяющий всегда видит свежее,
   а без сети прототип всё равно открывается. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  /* no-cache: браузер перепроверяет файл у сервера (GitHub Pages отдаёт max-age 10 минут),
     иначе после выкатки проверяющий ещё 10 минут видит старую сборку */
  const same = new URL(e.request.url).origin === location.origin;
  e.respondWith(
    fetch(same ? new Request(e.request, { cache: 'no-cache' }) : e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
