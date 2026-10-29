/* TopicsDigester service worker (app version 1.2)
   - Page files: network first, so updates arrive as soon as the visitor is online; saved copy when offline.
   - Public story lists (/api/articles, /api/catalogue): network first with a saved copy, marked with X-Offline-Copy.
   - Never saves translations, owner pages or anything else: POST and all other addresses go straight to the network.
   Bump VERSION when this file or the list of files changes. */
const VERSION = '1.2';
const STATIC = 'td-static-' + VERSION;
const DATA = 'td-data';
const FILES = ['./', 'index.html', 'config.js', 'hamdelan-theme.css', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];
const DATA_PATHS = ['/api/articles', '/api/catalogue'];
const OFFLINE_HTML = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TopicsDigester</title>' +
  '<body style="font:18px/1.5 Georgia,serif;background:#FFFDF7;color:#2B2927;margin:0;padding:32px;max-width:560px">' +
  '<h1 style="color:#0B2A52">You are offline</h1><p>TopicsDigester could not load and no saved copy is on this device yet. ' +
  'Connect to the internet and open it again; after one visit it can show your last stories without a connection.</p></body>';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(STATIC);
    await Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})));   // one missing file must not stop installation
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('td-static-') && k !== STATIC) await caches.delete(k);
    await self.clients.claim();
  })());
});

function withTimeout(req, ms) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  return fetch(req, { signal: ctl.signal }).finally(() => clearTimeout(t));
}

async function dataRequest(req) {
  const cache = await caches.open(DATA);
  try {
    const res = await withTimeout(req, 10000);
    if (res.ok) {
      const copy = new Response(await res.clone().blob(), { status: 200, headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json', 'X-Cached-At': String(Date.now()) } });
      await cache.put(req.url, copy);
    }
    return res;
  } catch (err) {
    const hit = await cache.match(req.url);
    if (hit) {
      const h = new Headers(hit.headers); h.set('X-Offline-Copy', h.get('X-Cached-At') || '1');
      return new Response(await hit.blob(), { status: 200, headers: h });
    }
    throw err;
  }
}

async function pageRequest(req) {
  const cache = await caches.open(STATIC);
  try {
    const res = await withTimeout(req, 8000);
    if (res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true }) || await cache.match('index.html') || await cache.match('./');
    return hit || new Response(OFFLINE_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                                   // translations (POST) and everything else: network only
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (DATA_PATHS.includes(url.pathname) && (sameOrigin || url.hostname.startsWith('api.'))) { e.respondWith(dataRequest(req)); return; }
  if (!sameOrigin) return;
  if (req.mode === 'navigate') { e.respondWith(pageRequest(req)); return; }
  const name = url.pathname.split('/').pop();
  if (FILES.includes(name) || name === '') e.respondWith(pageRequest(req));
});
