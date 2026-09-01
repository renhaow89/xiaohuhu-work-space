// Xiaohuhu Work Space — Service Worker
// 版本：v1.4.0
// 负责离线资源缓存、秒开加速与断网降级
// 严禁缓存任何 Supabase / REST API 请求，确保多端实时数据绝对新鲜
// 缓存策略：NetworkFirst — 联网时始终请求最新资源，断网时回退缓存

const CACHE_NAME = 'xiaohuhu-v1.4.0';

// 核心静态资源离线缓存清单
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './dashboard.js',
  './task-panel.js',
  './calendar-panel.js',
  './journal-panel.js',
  './reading-panel.js',
  './research-panel.js',
  './file-panel.js',
  './settings-panel.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  '../core/version.js',
  '../core/config.js',
  '../core/storage.js',
  '../core/data-adapter.js',
  '../core/database.js',
  '../core/backup.js',
  '../core/backup-history.js',
  '../core/migration.js',
  '../core/sync-manager.js',
  '../core/event.js',
  '../core/model.js',
  '../modules/task.js',
  '../modules/schedule.js',
  '../modules/journal.js',
  '../modules/reading.js',
  '../modules/research.js',
  '../modules/review.js',
  '../modules/finance.js'
];

// 安装阶段：预缓存全部关键静态文件并立即接管
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline assets for', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧版本缓存并立即生效
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截阶段：NetworkFirst 策略
// 联网时始终优先请求网络获取最新资源，更新缓存后返回；
// 仅在网络请求失败（断网）时才回退到本地缓存，确保离线可用。
// Supabase / API 请求一律直连网络，不做任何拦截。
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 关键规则：只处理本站同源的静态前端文件，绝不拦截 Supabase、API 或第三方请求
  if (url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.includes('/auth/v1') || url.pathname.includes('/rest/v1') || url.hostname.includes('supabase.co')) {
    return;
  }

  // NetworkFirst：先请求网络，网络失败时回退缓存
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // 网络请求成功：更新缓存并返回最新响应
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 网络失败（离线）：回退本地缓存
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[ServiceWorker] Offline fallback from cache:', request.url);
            return cachedResponse;
          }
          // 缓存也没有：返回空响应防止页面崩溃
          return new Response('', { status: 503, statusText: 'Service Unavailable (Offline)' });
        });
      })
  );
});
