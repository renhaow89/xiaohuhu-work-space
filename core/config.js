// Xiaohuhu Work Space — 应用配置
// V1.0.7: 版本号统一由 version.js 管理，此处僅保留功能开关配置

import AppVersion from './version.js';

const CONFIG = {
  appName: AppVersion.app,
  version: AppVersion.version,
  schema: AppVersion.schema,
  storage: 'localStorage',
  features: {
    ai: false,
    mcp: false,
    cloudSync: false
  }
};

export default CONFIG;
