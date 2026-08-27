// Xiaohuhu Work Space — 前端应用入口
// 全局启动引导器：初始化 Dashboard 与多端实时同步引擎

import './dashboard.js';
import SyncManager from '../core/sync-manager.js';
import Dashboard from './dashboard.js';

// 应用启动时立即初始化同步引擎并开启后台秒级自动拉取
(async () => {
  try {
    await SyncManager.init();
    if (SyncManager.isEnabled) {
      // 启动时在后台静默同步一次云端最新数据
      SyncManager.sync()
        .then(() => Dashboard.refreshAllPanels())
        .catch((e) => console.log('[SyncManager] Startup sync check:', e));
    }
  } catch (err) {
    console.warn('[App] Startup sync initialization failed:', err);
  }
})();

// 注册 PWA Service Worker 实现离线运行与秒开
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered successfully with scope:', reg.scope);
        if (reg.update) {
          reg.update();
        }
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
  });

  // 监听 ServiceWorker 控制权转移（新版本激活）
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] New version activated.');
  });
}
