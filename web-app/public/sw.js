const CACHE_NAME = 'hui-chuthao-v2';

// Bỏ qua cache cho các request API (Supabase, auth)
function isApiRequest(url) {
  return url.includes('supabase.co') || url.includes('/auth/') || url.includes('/rest/');
}

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Kích hoạt SW mới ngay lập tức
});

self.addEventListener('activate', (e) => {
  // Xóa cache cũ khi SW mới được kích hoạt
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Không cache các request API
  if (isApiRequest(e.request.url)) return;

  // Network-first: Ưu tiên mạng, fallback cache cho offline
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
