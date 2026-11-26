const appRoot = new URL(self.registration.scope);
const cachePrefix = 'little-storage:'+appRoot.pathname+':';
const cacheName = cachePrefix+'7f9634ce197a';
const entry = new URL('index.html', appRoot);
self.addEventListener('install', event => event.waitUntil((async () => {
 const response = await fetch(entry, {cache:'reload'});
 if (!response.ok || !(await response.clone().text()).includes('name="little-storage-web-app"')) {
  throw new Error('小倉庫首頁無法快取。');
 }
 await (await caches.open(cacheName)).put(entry, response);
 await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
 for (const key of await caches.keys()) {
  if (key.startsWith(cachePrefix) && key !== cacheName) await caches.delete(key);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if (request.mode !== 'navigate' || request.method !== 'GET' || url.origin !== appRoot.origin ||
     (url.pathname !== appRoot.pathname && url.pathname !== entry.pathname)) return;
 event.respondWith((async () => {
  const cache = await caches.open(cacheName);
  try {
   const response = await fetch(request);
   if (response.ok && !response.redirected && (response.headers.get('Content-Type') || '').includes('text/html')) {
    const copy = response.clone();
    if ((await copy.text()).includes('name="little-storage-web-app"')) await cache.put(entry, response.clone());
   }
   return response;
  } catch (error) {
   return (await cache.match(entry)) || new Response('需要連網開啟小倉庫。', {status:503,headers:{'content-type':'text/plain; charset=utf-8'}});
  }
 })());
});
