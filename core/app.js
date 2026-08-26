// Xiaohuhu Work Space core entry

import { storage } from './storage.js';
import { config } from './config.js';

const modules = {};

export function registerModule(name, module) {
  modules[name] = module;
}

export function getModule(name) {
  return modules[name];
}

export async function initApp() {
  console.log(config.appName, config.version);

  await storage.init();

  return {
    config,
    modules,
    storage
  };
}
