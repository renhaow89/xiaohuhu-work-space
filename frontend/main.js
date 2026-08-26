// Xiaohuhu Work Space — 前端应用入口

import './dashboard.js';

// 注册 PWA Service Worker 实现离线运行与秒开
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
  });
}
