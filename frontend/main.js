// Xiaohuhu Work Space — 前端应用入口

import './dashboard.js';

// 注册 PWA Service Worker 实现离线运行与秒开
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered successfully with scope:', reg.scope);
        // 主动检查并更新 ServiceWorker
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
