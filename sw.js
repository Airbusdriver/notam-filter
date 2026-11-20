// 오프라인 캐시 — 파일을 바꾸면 VERSION을 올리세요
const VERSION = 'nf-v1.11.3';
const FILES = ['./', './index.html', './app.js', './core.js', './interp.js', './decode.js', './literal.js', './trfile.js', './route.js', './route-view.js', './fuel.js', './fuel-view.js', './init.js', './init-view.js', './mel.js', './mel-view.js', './edto.js', './edto-view.js', './refile.js', './refile-view.js', './pdf.min.mjs', './pdf.worker.min.mjs',
  './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    // 캐시 우선. 페이지 열기(navigate) 요청이 캐시에 없으면 index.html로 대체 — 주소 뒤에 ?·# 등이 붙어도 오프라인에서 열림
    let hit = await caches.match(req, { ignoreSearch: true });
    if (!hit && req.mode === 'navigate') hit = await caches.match('./index.html') || await caches.match('./');
    const net = fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin) { const cp = res.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
      return res;
    }).catch(() => hit || Response.error());
    return hit || net;
  })());
});
