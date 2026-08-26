// Xiaohuhu Work Space — 应用核心入口
// V1.0.7: 修复 import 错误，使用正确的 default import

import Storage from './storage.js';
import CONFIG from './config.js';

const modules = {};

/** 注册一个模块 */
export function registerModule(name, module) {
  modules[name] = module;
}

/** 获取已注册的模块 */
export function getModule(name) {
  return modules[name];
}

/**
 * 初始化应用
 * 输出应用名称和版本，返回应用全局状态
 */
export async function initApp() {
  console.log(`[App] ${CONFIG.appName} v${CONFIG.version} (schema ${CONFIG.schema})`);
  console.log('[App] Storage layer ready');

  return {
    config: CONFIG,
    modules,
    storage: Storage
  };
}
