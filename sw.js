/* 인터넷 없이 열기: 첫 접속 때 모든 파일을 저장해 둔다.
   첫 화면은 인터넷 우선(3초 안에 안 오면 저장본), 나머지는 저장본 우선.
   VERSION과 FILES는 tools/build.py가 쓴다. */
const VERSION = 'fd8dccd8';
const FILES = [
  './',
  './fonts/Pretendard-400.440bc1fe.woff2',
  './fonts/Pretendard-700.425bb8fe.woff2',
  './icon-192.png',
  './icon-512.png',
  './img/app-analysis-cards.webp',
  './img/app-goal.webp',
  './img/app-history.webp',
  './img/app-home.webp',
  './img/app-meds4.webp',
  './img/app-peer-bmi.webp',
  './img/app-upload.webp',
  './index.html',
  './manifest.webmanifest',
];
const PAGE = './index.html';
const WAIT_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(pageFirstNetwork(req));
  } else {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
  }
});

async function pageFirstNetwork(req) {
  const cache = await caches.open(VERSION);
  const net = fetch(req, { cache: 'no-cache' }).then(res => {
    if (res.ok) cache.put(PAGE, res.clone());
    return res;
  });
  net.catch(() => {});
  const late = new Promise(r => setTimeout(r, WAIT_MS, null));
  try {
    const res = await Promise.race([net, late]);
    if (res && res.ok) return res;
  } catch (err) { /* 인터넷 끊김 → 저장본 */ }
  const saved = await cache.match(PAGE);
  return saved || net;
}
