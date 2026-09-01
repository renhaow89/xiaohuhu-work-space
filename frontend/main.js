// Xiaohuhu Work Space — 前端应用入口
// 全局启动引导器：初始化 Dashboard 与多端实时同步引擎

import './dashboard.js';
import SyncManager from '../core/sync-manager.js';
import Dashboard from './dashboard.js';

// 全局一键深度清理离线缓存并强制更新版本（彻底穿透 CDN 与 PWA 缓存）
window.clearAppCacheAndReload = async function () {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    }
    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => caches.delete(key)));
    }
    const basePath = window.location.pathname.includes('/frontend/')
      ? window.location.pathname
      : window.location.pathname.replace(/\/+$/, '') + '/frontend/index.html';
    const targetUrl = window.location.origin + basePath + '?_v=' + Date.now() + (window.location.hash || '');
    window.location.href = targetUrl;
  } catch (err) {
    alert('缓存清理失败: ' + err.message);
  }
};

// 启动时异步初始化多端实时同步引擎并在完成后刷新所有面板
(async () => {
  try {
    await SyncManager.init();
    if (SyncManager.isEnabled) {
      SyncManager.sync()
        .then(() => Dashboard.refreshAllPanels())
        .catch((e) => console.log('[SyncManager] Startup sync check:', e));
    }
  } catch (err) {
    console.warn('[App] Startup sync initialization failed:', err);
  }
})();

// 注册 PWA Service Worker 生命周期与缓存清理
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        if (reg.update) reg.update();
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
  });

  // 监听 Service Worker 控制器变更：新版本激活后自动平滑重载页面
  // 防抖标志防止循环触发
  let _swReloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (_swReloading) return;
    _swReloading = true;
    console.log('[PWA] New Service Worker activated, reloading for latest version...');
    window.location.reload();
  });
}
