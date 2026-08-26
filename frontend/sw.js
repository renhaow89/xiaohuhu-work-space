// Xiaohuhu Work Space — Service Worker
// 版本：v1.1.0
// 负责离线资源缓存、秒开加速与断网降级

const CACHE_NAME = 'xiaohuhu-v1.1.0';

// 核心静态资源离线缓存清单
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './dashboard.js',
  './task-panel.js',
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
      console.log('[ServiceWorker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 激活阶段：清理旧版本缓存
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

// 请求拦截阶段：Stale-While-Revalidate + Cache-First 离线保障策略
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 忽略非 GET 请求或浏览器扩展请求
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 1. 如果缓存中存在，先返回缓存，并在后台异步请求网络更新缓存（Stale-While-Revalidate）
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // 网络断开时的安全忽略
        console.log('[ServiceWorker] Offline mode, served from cache:', request.url);
      });

      return cachedResponse || fetchPromise;
    })
  );
});
